import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { OrderService } from '../order.service';
import { UpdateOrderStatusDto, OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderService: OrderService,
  ) {}

  async execute(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    await this.orderService.setStatusById(id, dto.status); // termasuk restock saat cancel
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    return OrderMapper.toResponseDto(order);
  }
}
