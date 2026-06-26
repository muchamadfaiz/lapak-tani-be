import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductContract } from '../product';
import {
  OrderRepository,
  OrderWithRelations,
} from './repository/order.repository';
import { OrderContract, OrderDetailRef } from './order.contract';

/**
 * Implementasi OrderContract + logika perubahan status (dengan restock saat
 * cancel) yang dipakai bersama oleh use-case admin & modul Payment.
 */
@Injectable()
export class OrderService extends OrderContract {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productContract: ProductContract,
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
  setStatusByNumber(orderNumber: string, status: string): Promise<void> {
    return this.applyStatus(
      () => this.orderRepository.findByOrderNumber(orderNumber),
      status,
    );
  }

  private async applyStatus(
    find: () => Promise<OrderWithRelations | null>,
    status: string,
  ): Promise<void> {
    const existing = await find();
    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    // Restock saat order dibatalkan (dari status non-cancelled).
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      await this.productContract.restoreStock(
        existing.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      );
    }
    await this.orderRepository.updateStatus(existing.id, status);
  }

  private static toDetail(o: OrderWithRelations): OrderDetailRef {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
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
