import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';

@Injectable()
export class FindOrderByIdUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    return OrderMapper.toResponseDto(order);
  }
}
