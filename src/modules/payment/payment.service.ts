import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderContract } from '../order';
import { SettingContract } from '../setting';
import { MidtransService, PaymentStatus, SnapResult } from './midtrans.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly midtrans: MidtransService,
    private readonly orderContract: OrderContract,
    private readonly settingContract: SettingContract,
  ) {}

  /** Buat transaksi Snap untuk sebuah order (status harus pending). */
  async createSnap(orderId: string): Promise<SnapResult> {
    // Dua gerbang: kredensial/env (midtrans.enabled) DAN toggle admin (setting).
    if (!this.midtrans.enabled) {
      throw new BadRequestException('Pembayaran online belum diaktifkan');
    }
    if (!(await this.settingContract.isOnlinePaymentEnabled())) {
      throw new BadRequestException('Pembayaran online sedang dinonaktifkan');
    }
    const order = await this.orderContract.getDetailById(orderId);
    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order ini sudah diproses');
    }
    return this.midtrans.createTransaction({
      orderNumber: order.orderNumber,
      grossAmount: order.total,
      shippingCost: order.shippingCost,
      customerName: order.customerName,
      phone: order.phone,
      items: order.items,
    });
  }

  /**
   * Status pembayaran untuk polling app (PAID | PENDING | CANCELLED).
   * Cek LANGSUNG ke Midtrans lalu sinkronkan status order (self-heal) — jadi
   * tak bergantung pada webhook. Aman dipanggil berulang (idempotent).
   */
  async getPaymentStatus(orderId: string): Promise<{ status: string }> {
    const order = await this.orderContract.getDetailById(orderId);
    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    const fromOrder = (s: string): string =>
      ['confirmed', 'processing', 'shipped', 'completed'].includes(s)
        ? 'PAID'
        : s === 'cancelled'
          ? 'CANCELLED'
          : 'PENDING';

    if (!this.midtrans.enabled) {
      return { status: fromOrder(order.status) };
    }

    try {
      const { orderNumber, status, paymentMethod } =
        await this.midtrans.readNotification({ order_id: order.orderNumber });
      // Sinkronkan order + channel bayar asli. Idempotent & aman diulang.
      try {
        await this.orderContract.setStatusByNumber(orderNumber, status, paymentMethod);
      } catch (e) {
        this.logger.warn(`Sync status ${orderNumber}: ${(e as Error).message}`);
      }
      return {
        status:
          status === 'confirmed'
            ? 'PAID'
            : status === 'cancelled'
              ? 'CANCELLED'
              : 'PENDING',
      };
    } catch {
      // Belum ada transaksi di Midtrans (belum bayar) → pakai status order.
      return { status: fromOrder(order.status) };
    }
  }

  /** Tangani webhook Midtrans → update status order. */
  async handleNotification(body: unknown): Promise<{ ok: boolean }> {
    let parsed: PaymentStatus;
    try {
      parsed = await this.midtrans.readNotification(body);
    } catch (e) {
      // Notifikasi tak bisa diverifikasi (mis. order tak dikenal / "Test
      // notification" dari dashboard). Tetap balas 200 agar Midtrans tak retry
      // terus; TIDAK mengubah order apa pun (aman dari spoofing).
      this.logger.warn(`Webhook tak terverifikasi: ${(e as Error).message}`);
      return { ok: true };
    }
    try {
      await this.orderContract.setStatusByNumber(
        parsed.orderNumber,
        parsed.status,
        parsed.paymentMethod,
      );
    } catch (e) {
      // Order mungkin tak ditemukan — log saja, tetap balas 200 ke Midtrans.
      this.logger.warn(`Webhook order ${parsed.orderNumber}: ${(e as Error).message}`);
    }
    return { ok: true };
  }
}
