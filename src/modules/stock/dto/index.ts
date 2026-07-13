import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class StockItemDto {
  @ApiProperty({ description: 'ID produk' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

/** Barang masuk gudang (pengadaan Lapak Tani sendiri). */
export class CreateProcurementDto {
  @ApiProperty({ description: 'Outlet/gudang tujuan barang masuk' })
  @IsUUID()
  outletId: string;

  @ApiProperty({ type: [StockItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  items: StockItemDto[];

  @ApiPropertyOptional({ example: 'Panen 13 Juli' })
  @IsOptional()
  @IsString()
  note?: string;
}

/** Kirim barang dari gudang ke outlet. */
export class CreateShipmentDto {
  @ApiProperty({ description: 'Outlet asal (biasanya gudang)' })
  @IsUUID()
  fromOutletId: string;

  @ApiProperty({ description: 'Outlet tujuan' })
  @IsUUID()
  toOutletId: string;

  @ApiProperty({ type: [StockItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  items: StockItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class FindShipmentsQueryDto {
  @ApiPropertyOptional({ description: 'Kiriman menuju outlet ini (dipakai kasir)' })
  @IsOptional()
  @IsUUID()
  toOutletId?: string;

  @ApiPropertyOptional({ description: 'Kiriman dari outlet/gudang ini' })
  @IsOptional()
  @IsUUID()
  fromOutletId?: string;

  @ApiPropertyOptional({ enum: ['sent', 'received', 'cancelled'] })
  @IsOptional()
  @IsIn(['sent', 'received', 'cancelled'])
  status?: string;
}

export class FindMovementsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outletId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
