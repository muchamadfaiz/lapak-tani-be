import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductContract } from '../product';
import { StockContract } from '../stock';
import {
  OrderRepository,
  OrderWithRelations,
} from './repository/order.repository';
import { CustomerRepository } from './repository/customer.repository';
import {
  OrderContract,
  OrderDetailRef,
  PosSaleResult,
  ShiftSalesSummary,
} from './order.contract';
import {
  calcEarnedPoints,
  generateOrderNumber,
  normalizePhone,
} from './order.util';

// Pelanggan "umum" untuk transaksi kasir tanpa No HP. Satu baris dipakai bersama;
// poin tidak dikreditkan untuk transaksi tanpa No HP asli.
const WALKIN_PHONE = 'pos-walkin';

/**
 * Implementasi OrderContract + logika perubahan status (restock saat cancel,
 * award poin saat completed) yang dipakai bersama use-case admin & Payment.
 */
@Injectable()
export class OrderService extends OrderContract {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productContract: ProductContract,
    private readonly customerRepository: CustomerRepository,
    private readonly stockContract: StockContract,
  ) {
    super();
  }

  async getDetailById(orderId: string): Promise<OrderDetailRef | null> {
    const o = await this.orderRepository.findById(orderId);
    return o ? OrderService.toDetail(o) : null;
  }

  /** Ubah status by id (dipakai admin). */
  setStatusById(orderId: string, status: string): Promise<void> {
    return this.applyStatus(() => this.orderRepository.findById(orderId), status);
  }

  /** Ubah status by orderNumber (dipakai webhook pembayaran). */
  setStatusByNumber(
    orderNumber: string,
    status: string,
    paymentMethod?: string,
  ): Promise<void> {
    return this.applyStatus(
      () => this.orderRepository.findByOrderNumber(orderNumber),
      status,
      paymentMethod,
    );
  }

  private async applyStatus(
    find: () => Promise<OrderWithRelations | null>,
    status: string,
    paymentMethod?: string,
  ): Promise<void> {
    const existing = await find();
    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    // Restock saat order dibatalkan (dari status non-cancelled).
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      const lines = existing.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      await this.productContract.restoreStock(existing.outletId, lines);
      // Catat pengembalian stok ke buku besar agar riwayat tetap cocok.
      await this.stockContract.recordSaleCancel(
        existing.outletId,
        lines,
        existing.id,
      );
    }
    await this.orderRepository.updateStatus(existing.id, status, paymentMethod);

    // Award poin saat order selesai (idempotent, hanya transisi pertama).
    if (status === 'completed' && existing.status !== 'completed') {
      await this.customerRepository.awardPoints(
        existing.customerId,
        existing.id,
        calcEarnedPoints(existing.total),
      );
    }
  }

  // ── POS (penjualan kasir) ──

  async createPosSale(input: {
    outletId: string;
    shiftId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: string;
    amountPaid?: number;
    phone?: string;
    customerName?: string;
    notes?: string;
  }): Promise<PosSaleResult> {
    // 1. Validasi produk + stok di outlet ini (hindari N+1).
    const ids = [...new Set(input.items.map((i) => i.productId))];
    const products = await this.productContract.findByIds(ids);
    const map = new Map(products.map((p) => [p.id, p]));
    const stockMap = await this.productContract.getStock(input.outletId, ids);

    const items = input.items.map((it) => {
      const p = map.get(it.productId);
      if (!p) throw new BadRequestException(`Produk ${it.productId} tidak ditemukan`);
      if (!p.isAvailable) throw new BadRequestException(`Produk "${p.name}" tidak tersedia`);
      if ((stockMap.get(p.id) ?? 0) < it.quantity) {
        throw new BadRequestException(`Stok "${p.name}" tidak cukup`);
      }
      return {
        productId: p.id,
        productName: p.name,
        price: p.price,
        quantity: it.quantity,
        subtotal: p.price * it.quantity,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const total = subtotal; // kasir: tanpa ongkir

    // 2. Uang tunai wajib cukup untuk metode cash.
    let amountPaid: number | null = null;
    let changeAmount = 0;
    if (input.paymentMethod === 'cash') {
      if (input.amountPaid === undefined) {
        throw new BadRequestException('Uang tunai (amountPaid) wajib untuk metode cash');
      }
      if (input.amountPaid < total) {
        throw new BadRequestException('Uang tunai kurang dari total');
      }
      amountPaid = input.amountPaid;
      changeAmount = input.amountPaid - total;
    }

    // 3. Pelanggan: pakai No HP bila ada (dapat poin), jika tidak → walk-in.
    const hasPhone = !!input.phone;
    const customer = hasPhone
      ? await this.customerRepository.upsertByPhone(
          normalizePhone(input.phone!),
          input.customerName,
        )
      : await this.customerRepository.upsertByPhone(WALKIN_PHONE, 'Umum');

    // 4. Kurangi stok atomik (anti oversell).
    await this.productContract.decrementStock(
      input.outletId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );

    // 5. Simpan order LUNAS (completed), tanpa alamat/ongkir.
    const order = await this.orderRepository.createWithItems({
      orderNumber: generateOrderNumber(),
      customerId: customer.id,
      outletId: input.outletId,
      subtotal,
      shippingCost: 0,
      total,
      paymentMethod: input.paymentMethod,
      deliveryOption: 'instant',
      shippingAddress: '-', // transaksi di tempat
      notes: input.notes,
      status: 'completed',
      source: 'pos',
      shiftId: input.shiftId,
      amountPaid: amountPaid ?? undefined,
      items,
    });

    // 6. Catat penjualan ke buku besar stok.
    await this.stockContract.recordSale(
      input.outletId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      order.id,
    );

    // 7. Poin langsung dikreditkan (order sudah completed) — hanya bila No HP asli.
    let earnedPoints = 0;
    if (hasPhone) {
      earnedPoints = calcEarnedPoints(total);
      await this.customerRepository.awardPoints(customer.id, order.id, earnedPoints);
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      outletId: order.outletId,
      items: items.map((i) => ({
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal,
      total,
      paymentMethod: input.paymentMethod,
      amountPaid,
      changeAmount,
      customerName: hasPhone ? customer.name : input.customerName ?? null,
      phone: hasPhone ? customer.phone : null,
      earnedPoints,
      createdAt: order.createdAt,
    };
  }

  async summarizeShiftSales(shiftId: string): Promise<ShiftSalesSummary> {
    const sales = await this.orderRepository.findByShiftId(shiftId);
    const active = sales.filter((o) => o.status !== 'cancelled');
    const cashSales = active
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + o.total, 0);
    const totalSales = active.reduce((s, o) => s + o.total, 0);
    return {
      transactionCount: active.length,
      totalSales,
      cashSales,
      nonCashSales: totalSales - cashSales,
    };
  }

  async findShiftSales(shiftId: string): Promise<PosSaleResult[]> {
    const sales = await this.orderRepository.findByShiftId(shiftId);
    return sales.map((o) => OrderService.toPosResult(o));
  }

  private static toPosResult(o: OrderWithRelations): PosSaleResult {
    const amountPaid = o.amountPaid ?? null;
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      outletId: o.outletId,
      items: o.items.map((i) => ({
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal: o.subtotal,
      total: o.total,
      paymentMethod: o.paymentMethod,
      amountPaid,
      changeAmount: amountPaid !== null ? Math.max(0, amountPaid - o.total) : 0,
      customerName: o.customer.name,
      phone: o.customer.phone === WALKIN_PHONE ? null : o.customer.phone,
      earnedPoints: calcEarnedPoints(o.total),
      createdAt: o.createdAt,
    };
  }

  private static toDetail(o: OrderWithRelations): OrderDetailRef {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      shippingCost: o.shippingCost,
      customerName: o.customer.name,
      phone: o.customer.phone,
      items: o.items.map((i) => ({
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
      })),
    };
  }
}
