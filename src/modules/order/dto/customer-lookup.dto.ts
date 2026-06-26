import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from './order-response.dto';

export class PointHistoryDto {
  @ApiProperty({ example: 'earn' })
  type: string;

  @ApiProperty({ example: 25 })
  amount: number;

  @ApiProperty({ example: 125 })
  balanceAfter: number;

  @ApiProperty({ nullable: true })
  orderId: string | null;

  @ApiProperty({ nullable: true })
  note: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class CustomerLookupDto {
  @ApiProperty({ example: '6281234567890' })
  phone: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ example: 125, description: 'Saldo poin' })
  points: number;

  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty({ type: [PointHistoryDto] })
  pointHistory: PointHistoryDto[];
}
