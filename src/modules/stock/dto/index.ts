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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageOptionsDto } from '../../../common';

export class StockItemDto {
  @ApiProperty({ description: 'ID produk' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ProcurementItemDto extends StockItemDto {
  @ApiPropertyOptional({
    example: 12000,
    description: 'Harga modal per satuan (Rupiah). Opsional — untuk hitung margin.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  unitCost?: number;
}

/** Barang masuk gudang (pengadaan Lapak Tani sendiri). */
export class CreateProcurementDto {
  @ApiProperty({ description: 'Outlet/gudang tujuan barang masuk' })
  @IsUUID()
  outletId: string;

  @ApiProperty({ type: [ProcurementItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcurementItemDto)
  items: ProcurementItemDto[];

  @ApiPropertyOptional({ example: 'CV Tani Makmur' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;

  @ApiPropertyOptional({ example: 'INV-2026-0713' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;

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

/** Paginasi (page/limit dari PageOptionsDto) + filter. */
export class FindShipmentsQueryDto extends PageOptionsDto {
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

export class FindProcurementsQueryDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  outletId?: string;
}

/**
 * Riwayat stok tumbuh cepat (tiap item terjual = 1 baris), jadi WAJIB
 * terpaginasi + bisa difilter per outlet/produk/tanggal.
 */
/** Koreksi stok / stok opname: set stok absolut satu produk di satu outlet. */
export class AdjustStockDto {
  @ApiProperty({ description: 'Outlet (atau gudang)' })
  @IsUUID()
  outletId: string;

  @ApiProperty({ description: 'Produk' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 50, description: 'Stok baru (jumlah fisik hasil hitung)' })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity: number;

  @ApiPropertyOptional({ example: 'Stok opname 15 Juli' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class FindMovementsQueryDto extends PageOptionsDto {
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
