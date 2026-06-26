import { OrderWithRelations } from '../repository/order.repository';
import { OrderResponseDto } from '../dto';

export class OrderMapper {
  static toResponseDto(
    order: OrderWithRelations,
    whatsappUrl?: string,
  ): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      outletId: order.outletId,
      status: order.status,
      customerName: order.customer.name,
      phone: order.customer.phone,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      distanceKm: order.distanceKm,
      expiresAt: order.expiresAt,
      ...(whatsappUrl && { whatsappUrl }),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toResponseDtoList(orders: OrderWithRelations[]): OrderResponseDto[] {
    return orders.map((o) => OrderMapper.toResponseDto(o));
  }
}
