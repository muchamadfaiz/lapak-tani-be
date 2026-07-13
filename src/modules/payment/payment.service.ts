import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderContract } from '../order';
import { SettingContract } from '../setting';
import { CheckoutResult, XenditService } from './xendit.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly xendit: XenditService,
    private readonly orderContract: OrderContract,
    private readonly settingContract: SettingContract,
  ) {}

  /**
   * Buat halaman bayar (Xendit Invoice) untuk sebuah order pending.
   * Dua gerbang: kredensial/env (xendit.enabled) DAN toggle admin (setting).
   */
  async createCheckout(orderId: string): Promise<CheckoutResult> {
    if (!this.xendit.enabled) {
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
    return this.xendit.createInvoice({
      orderNumber: order.orderNumber,
      amount: order.total,
      shippingCost: order.shippingCost,
      customerName: order.customerName,
      phone: order.phone,
      items: order.items,
    });
  }

  /**
   * Status pembayaran untuk polling app (PAID | PENDING | CANCELLED).
   * Cek LANGSUNG ke Xendit lalu sinkronkan status order (self-heal) — jadi tak
   * bergantung pada webhook. Aman dipanggil berulang (idempotent).
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

    // Order SUDAH final (dibayar/dibatalkan — lewat webhook, verifikasi bukti
    // transfer oleh admin, atau COD) → order yang benar. JANGAN turunkan lagi
    // ke PENDING hanya karena invoice Xendit-nya masih PENDING/tak terpakai.
    // Xendit hanya ditanya saat order masih menunggu pembayaran.
    if (order.status !== 'pending') {
      return { status: fromOrder(order.status) };
    }

    if (!this.xendit.enabled) {
      return { status: fromOrder(order.status) };
    }

    try {
      const { orderNumber, status, paymentMethod } =
        await this.xendit.getStatusByOrderNumber(order.orderNumber);
      await this.sync(orderNumber, status, paymentMethod);
      return {
        status:
          status === 'confirmed'
            ? 'PAID'
            : status === 'cancelled'
              ? 'CANCELLED'
              : 'PENDING',
      };
    } catch {
      // Belum ada invoice di Xendit (belum klik bayar) → pakai status order.
      return { status: fromOrder(order.status) };
    }
  }

  /** Webhook Xendit → update status order. Token wajib cocok. */
  async handleCallback(
    token: string | undefined,
    body: unknown,
  ): Promise<{ ok: boolean }> {
    try {
      const { orderNumber, status, paymentMethod } = this.xendit.readCallback(
        token,
        body,
      );
      await this.sync(orderNumber, status, paymentMethod);
    } catch (e) {
      // Callback tak terverifikasi / order tak dikenal. Tetap balas 200 agar
      // Xendit tidak retry terus; TIDAK mengubah order apa pun (anti-spoofing).
      this.logger.warn(`Callback Xendit ditolak: ${(e as Error).message}`);
    }
    return { ok: true };
  }

  /** Sinkronkan status order + channel bayar asli. Idempotent. */
  private async sync(
    orderNumber: string,
    status: string,
    paymentMethod?: string,
  ): Promise<void> {
    if (status === 'pending') return; // belum bayar → jangan sentuh order
    try {
      await this.orderContract.setStatusByNumber(
        orderNumber,
        status,
        paymentMethod,
      );
    } catch (e) {
      this.logger.warn(`Sync status ${orderNumber}: ${(e as Error).message}`);
    }
  }
}
