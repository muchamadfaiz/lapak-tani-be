import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

// Kolom Int PostgreSQL maksimal 2.147.483.647. Batasi di bawahnya agar tak
// overflow (angka kebesaran → 400 jelas, bukan 500 Prisma).
const MAX_AMOUNT = 2_000_000_000; // Rupiah
const MAX_STOCK = 1_000_000; // unit

export class CreateProductDto {
  @ApiProperty({ example: 'Beras Premium Pandan Wangi 5kg' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Beras putih premium, harum dan pulen' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 78000, description: 'Harga jual (Rupiah, tanpa desimal)' })
  @IsInt()
  @Min(0)
  @Max(MAX_AMOUNT, { message: 'Harga jual terlalu besar (maks 2.000.000.000)' })
  price: number;

  @ApiPropertyOptional({ example: 65000, description: 'Harga modal (Rupiah)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_AMOUNT, { message: 'Harga modal terlalu besar (maks 2.000.000.000)' })
  costPrice?: number;

  @ApiPropertyOptional({ example: 'kg', description: 'Satuan (kg, gram, pcs, ikat, dll)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'URL gambar produk' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID kategori' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'ID outlet' })
  @IsUUID()
  outletId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Stok terlalu besar (maks 1.000.000)' })
  stock?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Jadikan Produk Pilihan' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
