import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DELIVERY_OPTIONS } from '../order.util';

export class OrderItemInputDto {
  @ApiProperty({ description: 'ID produk' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Outlet tempat memesan' })
  @IsUUID()
  outletId: string;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({
    example: '081234567890',
    description: 'No HP pemesan (wajib)',
  })
  @IsString()
  @Matches(/^[0-9+]{8,16}$/, { message: 'Nomor HP tidak valid' })
  phone: string;

  @ApiPropertyOptional({ example: 'Budi', description: 'Nama pemesan' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 1, RT 01' })
  @IsString()
  @MinLength(5)
  shippingAddress: string;

  @ApiProperty({
    example: 'cod',
    description: 'Metode bayar (transfer_bca, cod, qris, dll)',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({
    enum: DELIVERY_OPTIONS,
    default: 'instant',
    description:
      'Opsi pengiriman: instant (10rb/km) | scheduled_morning | scheduled_afternoon (2rb/km)',
  })
  @IsOptional()
  @IsIn(DELIVERY_OPTIONS)
  deliveryOption?: (typeof DELIVERY_OPTIONS)[number];

  @ApiPropertyOptional({ example: 'Lantai 2, dekat lift' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Latitude tujuan (untuk ongkir)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude tujuan (untuk ongkir)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description:
      'Jarak ke tujuan (km) — dipakai untuk ongkir bila lat/lng tak dikirim (mis. dari app mobile)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  distanceKm?: number;
}
