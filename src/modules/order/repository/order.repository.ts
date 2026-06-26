import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const ORDER_INCLUDE = { items: true, customer: true } as const;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

export interface OrderFilter {
  status?: string;
  outletId?: string;
}

/**
 * Pemilik data tabel `orders` & `order_items`. Satu-satunya tempat yang boleh
 * mengakses `prisma.order`/`prisma.orderItem`.
 */
@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithItems(data: {
    orderNumber: string;
    customerId: string;
    outletId: string;
    subtotal: number;
    shippingCost: number;
    total: number;
    paymentMethod: string;
    shippingAddress: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    distanceKm?: number;
    items: {
      productId: string;
      productName: string;
      price: number;
      quantity: number;
      subtotal: number;
    }[];
  }): Promise<OrderWithRelations> {
    const { items, ...order } = data;
    return this.prisma.order.create({
      data: {
        ...order,
        items: { create: items },
      },
      include: ORDER_INCLUDE,
    });
  }

  findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  findByOrderNumber(orderNumber: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });
  }

  findAll(filter: OrderFilter): Promise<OrderWithRelations[]> {
    const where: Prisma.OrderWhereInput = {
      ...(filter.status && { status: filter.status }),
      ...(filter.outletId && { outletId: filter.outletId }),
    };
    return this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: string): Promise<OrderWithRelations> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  }
}
