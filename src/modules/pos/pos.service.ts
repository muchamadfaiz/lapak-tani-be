import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashierShift } from '@prisma/client';
import { OrderContract, PosSaleResult } from '../order';
import { StockContract, StockShipmentView } from '../stock';
import { OutletContract } from '../outlet';
import { UserContract } from '../user';
import { PaymentContract } from '../payment';
import { ShiftRepository } from './repository/shift.repository';
import { CreatePosSaleDto, CloseShiftDto, OpenShiftDto } from './dto';

export interface ShiftReport {
  id: string;
  outletId: string;
  outletName: string | null;
  cashierName: string;
  status: string;
  openingCash: number;
  closingCash: number | null;
  openedAt: Date;
  closedAt: Date | null;
  transactionCount: number;
  totalSales: number;
  cashSales: number;
  nonCashSales: number;
  expectedCash: number;
  /** closingCash - expectedCash (null bila shift belum ditutup). */
  difference: number | null;
}

export interface CloseShiftResult {
  shift: CashierShift;
  transactionCount: number;
  totalSales: number;
  cashSales: number;
  nonCashSales: number;
  /** openingCash + cashSales — kas yang seharusnya ada di laci. */
  expectedCash: number;
  /** closingCash - expectedCash (positif = lebih, negatif = kurang). */
  difference: number;
}

/**
 * Alur kasir (POS). Setiap operasi terikat pada outlet kasir (dari JWT) — kasir
 * tak bisa menyentuh outlet lain. Transaksi penjualan & stok tetap dilakukan
 * modul Order/Stock lewat kontraknya (POS tak menulis tabel mereka langsung).
 */
@Injectable()
export class PosService {
  constructor(
    private readonly shiftRepo: ShiftRepository,
    private readonly orderContract: OrderContract,
    private readonly stockContract: StockContract,
    private readonly outletContract: OutletContract,
    private readonly userContract: UserContract,
    private readonly paymentContract: PaymentContract,
  ) {}

  /** Laporan shift (admin): tiap shift + rekap penjualannya. */
  async getShiftReports(filter: {
    outletId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ShiftReport[]> {
    const shifts = await this.shiftRepo.findMany({
      outletId: filter.outletId,
      dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
      dateTo: filter.dateTo ? new Date(`${filter.dateTo}T23:59:59.999Z`) : undefined,
    });
    const outletCache = new Map<string, string | null>();
    const userCache = new Map<string, string>();

    return Promise.all(
      shifts.map(async (s) => {
        if (!outletCache.has(s.outletId)) {
          const o = await this.outletContract.findById(s.outletId);
          outletCache.set(s.outletId, o?.name ?? null);
        }
        if (!userCache.has(s.userId)) {
          let name = s.userId.slice(0, 8);
          try {
            const u = await this.userContract.getById(s.userId);
            name = u.profile?.fullName || u.email || name;
          } catch {
            /* user terhapus → pakai fallback */
          }
          userCache.set(s.userId, name);
        }
        const sum = await this.orderContract.summarizeShiftSales(s.id);
        const expectedCash = s.openingCash + sum.cashSales;
        return {
          id: s.id,
          outletId: s.outletId,
          outletName: outletCache.get(s.outletId) ?? null,
          cashierName: userCache.get(s.userId)!,
          status: s.status,
          openingCash: s.openingCash,
          closingCash: s.closingCash,
          openedAt: s.openedAt,
          closedAt: s.closedAt,
          transactionCount: sum.transactionCount,
          totalSales: sum.totalSales,
          cashSales: sum.cashSales,
          nonCashSales: sum.nonCashSales,
          expectedCash,
          difference:
            s.closingCash !== null ? s.closingCash - expectedCash : null,
        };
      }),
    );
  }

  /** Profil kasir + outlet tempat bertugas (dipakai app POS saat login). */
  async getMe(
    userId: string,
    email: string,
    role: string,
    outletId: string | null,
  ): Promise<{
    userId: string;
    email: string;
    name: string;
    role: string;
    outletId: string | null;
    outletName: string | null;
  }> {
    let outletName: string | null = null;
    if (outletId) {
      const o = await this.outletContract.findById(outletId);
      outletName = o?.name ?? null;
    }
    // Nama kasir untuk ditampilkan di struk & header POS.
    let name = email;
    try {
      const u = await this.userContract.getById(userId);
      name = u.profile?.fullName || u.email || email;
    } catch {
      /* fallback ke email */
    }
    return { userId, email, name, role, outletId, outletName };
  }

  /** Cari pelanggan by No HP (nama + poin) untuk konfirmasi di kasir. */
  lookupCustomer(phone: string) {
    if (!phone || phone.replace(/\D/g, '').length < 8) return null;
    return this.orderContract.findCustomerByPhone(phone);
  }

  private assertOutlet(outletId: string | null | undefined): string {
    if (!outletId) {
      throw new ForbiddenException(
        'Akun kasir belum ditugaskan ke outlet. Hubungi admin.',
      );
    }
    return outletId;
  }

  // ── Shift ──

  getActiveShift(userId: string): Promise<CashierShift | null> {
    return this.shiftRepo.findOpenByUser(userId);
  }

  async openShift(
    userId: string,
    outletId: string | null,
    dto: OpenShiftDto,
  ): Promise<CashierShift> {
    const oid = this.assertOutlet(outletId);
    const existing = await this.shiftRepo.findOpenByUser(userId);
    if (existing) {
      throw new BadRequestException('Masih ada sesi kasir yang terbuka');
    }
    return this.shiftRepo.open({ userId, outletId: oid, openingCash: dto.openingCash });
  }

  async closeShift(
    userId: string,
    dto: CloseShiftDto,
  ): Promise<CloseShiftResult> {
    const shift = await this.shiftRepo.findOpenByUser(userId);
    if (!shift) throw new BadRequestException('Tidak ada sesi kasir yang terbuka');

    const sum = await this.orderContract.summarizeShiftSales(shift.id);
    const expectedCash = shift.openingCash + sum.cashSales;
    const closed = await this.shiftRepo.close(shift.id, dto.closingCash, dto.note);

    return {
      shift: closed,
      transactionCount: sum.transactionCount,
      totalSales: sum.totalSales,
      cashSales: sum.cashSales,
      nonCashSales: sum.nonCashSales,
      expectedCash,
      difference: dto.closingCash - expectedCash,
    };
  }

  // ── Penjualan ──

  async createSale(
    userId: string,
    outletId: string | null,
    dto: CreatePosSaleDto,
  ): Promise<PosSaleResult> {
    const oid = this.assertOutlet(outletId);
    const shift = await this.shiftRepo.findOpenByUser(userId);
    if (!shift) {
      throw new BadRequestException('Buka sesi kasir dulu sebelum bertransaksi');
    }
    return this.orderContract.createPosSale({
      outletId: oid,
      shiftId: shift.id,
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      amountPaid: dto.amountPaid,
      phone: dto.phone,
      customerName: dto.customerName,
      notes: dto.notes,
    });
  }

  /**
   * Transaksi QRIS: buat order PENDING (stok direservasi) + QR dinamis Xendit.
   * Kasir menampilkan QR; pelunasan terjadi lewat webhook. FE polling status.
   */
  async createQrisSale(
    userId: string,
    outletId: string | null,
    dto: CreatePosSaleDto,
  ): Promise<{
    orderId: string;
    orderNumber: string;
    total: number;
    qrString: string;
    expiresAt: string | null;
    sandbox: boolean;
  }> {
    const oid = this.assertOutlet(outletId);
    const shift = await this.shiftRepo.findOpenByUser(userId);
    if (!shift) {
      throw new BadRequestException('Buka sesi kasir dulu sebelum bertransaksi');
    }
    const sale = await this.orderContract.createPosSalePending({
      outletId: oid,
      shiftId: shift.id,
      items: dto.items,
      paymentMethod: 'qris',
      phone: dto.phone,
      customerName: dto.customerName,
      notes: dto.notes,
    });
    try {
      const qr = await this.paymentContract.createPosQrCode(
        sale.orderNumber,
        sale.total,
      );
      return {
        orderId: sale.id,
        orderNumber: sale.orderNumber,
        total: sale.total,
        qrString: qr.qrString,
        expiresAt: qr.expiresAt,
        // Tombol "simulasikan bayar" hanya muncul di kasir saat mode sandbox.
        sandbox: this.paymentContract.isSandbox(),
      };
    } catch (e) {
      // Gagal buat QR → batalkan order pending agar stok kembali (tidak nyangkut).
      await this.orderContract
        .setStatusByNumber(sale.orderNumber, 'cancelled')
        .catch(() => undefined);
      throw e;
    }
  }

  /**
   * Status transaksi QRIS untuk polling kasir. Bila sudah LUNAS (completed),
   * sertakan hasil transaksi lengkap untuk struk.
   */
  async getSaleStatus(
    orderId: string,
  ): Promise<{ status: string; sale: PosSaleResult | null }> {
    const st = await this.orderContract.getPosOrderStatus(orderId);
    if (!st) throw new NotFoundException('Transaksi tidak ditemukan');
    const paid = st.status === 'completed';
    return {
      status: st.status,
      sale: paid ? await this.orderContract.getPosSaleResult(orderId) : null,
    };
  }

  /**
   * DEMO/SANDBOX SAJA: tandai transaksi QRIS pending jadi lunas tanpa scan asli
   * (menirukan webhook Xendit). Ditolak bila bukan mode sandbox — jadi aman di
   * produksi.
   */
  async simulatePaid(orderId: string): Promise<{ ok: boolean }> {
    if (!this.paymentContract.isSandbox()) {
      throw new ForbiddenException('Simulasi hanya tersedia di mode sandbox');
    }
    const st = await this.orderContract.getPosOrderStatus(orderId);
    if (!st) throw new NotFoundException('Transaksi tidak ditemukan');
    if (st.status !== 'pending') {
      throw new BadRequestException('Transaksi ini sudah tidak menunggu bayar');
    }
    // Jalur yang sama dengan webhook: confirmed → (POS) completed + poin.
    await this.orderContract.setStatusByNumber(st.orderNumber, 'confirmed', 'qris');
    return { ok: true };
  }

  /** Batalkan transaksi QRIS yang belum lunas → stok kembali. */
  async cancelSale(orderId: string): Promise<{ ok: boolean }> {
    const st = await this.orderContract.getPosOrderStatus(orderId);
    if (!st) throw new NotFoundException('Transaksi tidak ditemukan');
    if (st.status !== 'pending') {
      throw new BadRequestException('Transaksi ini tidak bisa dibatalkan');
    }
    await this.orderContract.setStatusByNumber(st.orderNumber, 'cancelled');
    return { ok: true };
  }

  async getShiftSales(userId: string): Promise<PosSaleResult[]> {
    const shift = await this.shiftRepo.findOpenByUser(userId);
    if (!shift) return [];
    return this.orderContract.findShiftSales(shift.id);
  }

  // ── Kiriman (kasir terima barang) ──

  listIncoming(outletId: string | null): Promise<StockShipmentView[]> {
    const oid = this.assertOutlet(outletId);
    return this.stockContract.listIncomingShipments(oid);
  }

  receiveShipment(
    outletId: string | null,
    shipmentId: string,
  ): Promise<StockShipmentView> {
    const oid = this.assertOutlet(outletId);
    return this.stockContract.receiveShipmentForOutlet(shipmentId, oid);
  }
}
