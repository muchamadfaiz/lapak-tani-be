import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Kolom Int PostgreSQL maksimal 2.147.483.647. Batasi di bawahnya agar tak
// overflow (angka kebesaran → 400 jelas, bukan 500 Prisma).
const MAX_AMOUNT = 2_000_000_000; // Rupiah
const MAX_STOCK = 1_000_000; // unit

/** Stok produk pada satu outlet (dipakai saat buat/ubah produk). */
export class OutletStockDto {
  @ApiProperty({ description: 'ID outlet' })
  @IsUUID()
  outletId: string;

  @ApiProperty({ default: 0, description: 'Stok di outlet ini' })
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Stok terlalu besar (maks 1.000.000)' })
  stock: number;
}

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

  @ApiPropertyOptional({ description: 'Kode barcode/SKU untuk scan cepat di kasir' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'URL gambar produk' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID kategori' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    type: [OutletStockDto],
    description: 'Stok per outlet. Outlet yang tak disebut dianggap stok 0.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutletStockDto)
  stocks?: OutletStockDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Jadikan Produk Pilihan' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Produk timbangan — dijual per berat (mis. per kg), qty boleh desimal',
  })
  @IsOptional()
  @IsBoolean()
  soldByWeight?: boolean;
}
