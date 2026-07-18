import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Metode bayar di kasir. */
export const POS_PAYMENT_METHODS = ['cash', 'qris', 'transfer', 'card'] as const;
export type PosPaymentMethod = (typeof POS_PAYMENT_METHODS)[number];

export class PosItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  // Float: mendukung produk timbangan (mis. 0.5 kg). Produk satuan pakai bilangan bulat.
  @ApiProperty({ example: 2, minimum: 0.001 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(100_000)
  quantity: number;
}

export class CreatePosSaleDto {
  @ApiProperty({ type: [PosItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items: PosItemDto[];

  @ApiProperty({ enum: POS_PAYMENT_METHODS, example: 'cash' })
  @IsIn(POS_PAYMENT_METHODS)
  paymentMethod: PosPaymentMethod;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Uang tunai diterima. Wajib untuk metode cash (>= total).',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amountPaid?: number;

  @ApiPropertyOptional({
    example: '081234567890',
    description: 'No HP pelanggan (opsional). Bila diisi, poin dikreditkan ke pelanggan.',
  })
  @IsOptional()
  @Matches(/^[0-9+]{8,16}$/, { message: 'Nomor HP tidak valid' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Budi' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OpenShiftDto {
  @ApiProperty({ example: 200000, description: 'Modal kas awal' })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  openingCash: number;
}

export class CloseShiftDto {
  @ApiProperty({ example: 850000, description: 'Kas fisik saat tutup (hitungan kasir)' })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  closingCash: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
