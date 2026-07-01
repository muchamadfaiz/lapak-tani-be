import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DistanceContract } from '../../distance';
import { OutletContract } from '../../outlet';
import { ProductContract, ProductRef } from '../../product';
import { NotificationContract } from '../../notification';
import { OrderRepository } from '../repository/order.repository';
import { CustomerRepository } from '../repository/customer.repository';
import { CreateOrderDto, OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';
import {
  buildWhatsappUrl,
  calcShippingCost,
  generateOrderNumber,
  normalizePhone,
  MIN_ONGKIR,
} from '../order.util';

const ADMIN_WA = process.env.WHATSAPP_ADMIN_NUMBER || '6285899731884';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly outletContract: OutletContract,
    private readonly productContract: ProductContract,
    private readonly notificationContract: NotificationContract,
    private readonly distanceContract: DistanceContract,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Validasi outlet (via contract)
    const outlet = await this.outletContract.findById(dto.outletId);
    if (!outlet) {
      throw new NotFoundException('Outlet tidak ditemukan');
    }
    if (!outlet.isActive) {
      throw new BadRequestException('Outlet sedang tidak aktif');
    }

    // 2. Ambil semua produk + stok di outlet ini sekaligus (via contract, hindari N+1)
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.productContract.findByIds(ids);
    const map = new Map<string, ProductRef>(products.map((p) => [p.id, p]));
    const stockMap = await this.productContract.getStock(dto.outletId, ids);

    // 3. Validasi tiap item + bangun snapshot
    const items = dto.items.map((item) => {
      const p = map.get(item.productId);
      if (!p) {
        throw new BadRequestException(
          `Produk ${item.productId} tidak ditemukan`,
        );
      }
      if (!p.isAvailable) {
        throw new BadRequestException(`Produk "${p.name}" tidak tersedia`);
      }
      if ((stockMap.get(p.id) ?? 0) < item.quantity) {
        throw new BadRequestException(`Stok "${p.name}" tidak cukup di outlet ini`);
      }
      return {
        productId: p.id,
        productName: p.name,
        price: p.price,
        quantity: item.quantity,
        subtotal: p.price * item.quantity,
      };
    });

    // 4. Hitung total + ongkir (BE)
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    let distanceKm: number | undefined;
    let shippingCost = MIN_ONGKIR;
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const raw = await this.distanceContract.distanceKm(
        outlet.latitude,
        outlet.longitude,
        dto.latitude,
        dto.longitude,
      );
      distanceKm = Math.round(raw * 10) / 10;
      shippingCost = calcShippingCost(distanceKm);
    }
    const total = subtotal + shippingCost;

    // 5. Pelanggan otomatis terdata lewat No HP (dinormalisasi → kunci konsisten)
    const customer = await this.customerRepository.upsertByPhone(
      normalizePhone(dto.phone),
      dto.customerName,
    );

    // 6. Kurangi stok outlet ini secara atomik (anti oversell). Bila gagal, order tak dibuat.
    await this.productContract.decrementStock(
      dto.outletId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );

    // 7. Simpan order + item (+ batas waktu bayar)
    const expireHours = Number(process.env.ORDER_PENDING_EXPIRE_HOURS || 24);
    const order = await this.orderRepository.createWithItems({
      orderNumber: generateOrderNumber(),
      customerId: customer.id,
      outletId: dto.outletId,
      subtotal,
      shippingCost,
      total,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      latitude: dto.latitude,
      longitude: dto.longitude,
      distanceKm,
      expiresAt: new Date(Date.now() + expireHours * 60 * 60 * 1000),
      items,
    });

    // Beri tahu admin (best-effort, jangan gagalkan order bila notif error).
    try {
      await this.notificationContract.notifyAdmins({
        title: 'Pesanan baru',
        message: `${order.orderNumber} — ${customer.name || customer.phone} • Rp${total.toLocaleString('id-ID')}`,
        type: 'order',
        data: { orderId: order.id, orderNumber: order.orderNumber },
      });
    } catch {
      // abaikan
    }

    // 7. Link WA untuk konfirmasi pembayaran manual
    const whatsappUrl = buildWhatsappUrl(ADMIN_WA, {
      orderNumber: order.orderNumber,
      customerName: customer.name,
      phone: customer.phone,
      items,
      subtotal,
      shippingCost,
      total,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
    });

    return OrderMapper.toResponseDto(order, whatsappUrl);
  }
}
