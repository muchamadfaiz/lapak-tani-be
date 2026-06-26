import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderRepository } from './repository/order.repository';
import { OrderService } from './order.service';

/**
 * Auto-batal order `pending` yang sudah lewat batas waktu bayar.
 * Scan periodik (default tiap 10 menit); order kedaluwarsa dibatalkan
 * lewat OrderService (sekaligus mengembalikan stok).
 *
 * Batas waktu disimpan per-order (`expiresAt`, di-set saat order dibuat =
 * createdAt + ORDER_PENDING_EXPIRE_HOURS). Cron hanya men-scan yang lewat.
 * Catatan: bila BE multi-instance, perlu distributed lock agar tak dobel.
 */
@Injectable()
export class OrderExpiryScheduler {
  private readonly logger = new Logger(OrderExpiryScheduler.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderService: OrderService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireStalePending(): Promise<void> {
    const expired = await this.orderRepository.findExpiredPending(new Date());
    if (expired.length === 0) return;

    this.logger.log(`Auto-expire: ${expired.length} order pending kedaluwarsa`);
    for (const order of expired) {
      try {
        await this.orderService.setStatusById(order.id, 'cancelled');
        this.logger.log(`Order ${order.orderNumber} dibatalkan (expired)`);
      } catch (e) {
        this.logger.warn(
          `Gagal auto-expire ${order.orderNumber}: ${(e as Error).message}`,
        );
      }
    }
  }
}
