import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductContract } from '../../product';
import { OrderRepository } from '../repository/order.repository';
import { UpdateOrderStatusDto, OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productContract: ProductContract,
  ) {}

  async execute(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    // Saat order dibatalkan (dari status non-cancelled), kembalikan stok produk.
    if (dto.status === 'cancelled' && existing.status !== 'cancelled') {
      await this.productContract.restoreStock(
        existing.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      );
    }

    const order = await this.orderRepository.updateStatus(id, dto.status);
    return OrderMapper.toResponseDto(order);
  }
}
