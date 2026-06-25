import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ORDER_STATUSES, OrderStatus } from '../order.util';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES, example: 'confirmed' })
  @IsIn(ORDER_STATUSES as unknown as string[])
  status: OrderStatus;
}
