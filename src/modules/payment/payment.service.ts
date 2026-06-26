import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderContract } from '../order';
import { MidtransService, SnapResult } from './midtrans.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly midtrans: MidtransService,
    private readonly orderContract: OrderContract,
  ) {}

  /** Buat transaksi Snap untuk sebuah order (status harus pending). */
  async createSnap(orderId: string): Promise<SnapResult> {
    if (!this.midtrans.enabled) {
      throw new BadRequestException('Pembayaran online belum diaktifkan');
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
      customerName: order.customerName,
      phone: order.phone,
    });
  }

  /** Tangani webhook Midtrans → update status order. */
  async handleNotification(body: unknown): Promise<{ ok: boolean }> {
    const { orderNumber, status } = await this.midtrans.readNotification(body);
    try {
      await this.orderContract.setStatusByNumber(orderNumber, status);
    } catch (e) {
      // Order mungkin tak ditemukan — log saja, tetap balas 200 ke Midtrans.
      this.logger.warn(`Webhook order ${orderNumber}: ${(e as Error).message}`);
    }
    return { ok: true };
  }
}
