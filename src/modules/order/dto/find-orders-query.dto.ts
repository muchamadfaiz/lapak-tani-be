import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ORDER_STATUSES } from '../order.util';

export class FindOrdersQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES, description: 'Filter status' })
  @IsOptional()
  @IsIn(ORDER_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter per outlet' })
  @IsOptional()
  @IsUUID()
  outletId?: string;
}
