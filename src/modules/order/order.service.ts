import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductContract } from '../product';
import {
  OrderRepository,
  OrderWithRelations,
} from './repository/order.repository';
import { CustomerRepository } from './repository/customer.repository';
import { OrderContract, OrderDetailRef } from './order.contract';
import { calcEarnedPoints } from './order.util';

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

    // Award poin saat order selesai (idempotent, hanya transisi pertama).
    if (status === 'completed' && existing.status !== 'completed') {
      await this.customerRepository.awardPoints(
        existing.customerId,
        existing.id,
        calcEarnedPoints(existing.total),
      );
    }
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
