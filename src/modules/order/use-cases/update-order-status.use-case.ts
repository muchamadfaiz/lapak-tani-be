import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { UpdateOrderStatusDto, OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    const order = await this.orderRepository.updateStatus(id, dto.status);
    return OrderMapper.toResponseDto(order);
  }
}
