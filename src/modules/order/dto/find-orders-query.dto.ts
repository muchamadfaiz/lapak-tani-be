import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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

  @ApiPropertyOptional({
    enum: ['online', 'pos'],
    description: 'Asal order: online (app/web) | pos (kasir). Kosong = semua.',
  })
  @IsOptional()
  // String kosong (?source=) diperlakukan sebagai "tak difilter".
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn(['online', 'pos'])
  source?: string;
}
