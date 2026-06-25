import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { FindOrdersQueryDto, OrderResponseDto } from '../dto';
import { OrderMapper } from '../mapper/order.mapper';

@Injectable()
export class FindAllOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(query: FindOrdersQueryDto): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findAll({
      status: query.status,
      outletId: query.outletId,
    });
    return OrderMapper.toResponseDtoList(orders);
  }
}
