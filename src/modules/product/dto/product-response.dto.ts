import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OutletStockResponseDto {
  @ApiProperty()
  outletId: string;

  @ApiProperty()
  stock: number;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Beras Premium Pandan Wangi 5kg' })
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 78000 })
  price: number;

  @ApiPropertyOptional({ nullable: true, example: 65000, description: 'Harga modal (internal, hanya untuk admin)' })
  costPrice?: number | null;

  @ApiProperty({
    nullable: true,
    example: 85000,
    description: 'Harga sebelum diskon (tampil tercoret). null = tidak promo.',
  })
  originalPrice: number | null;

  @ApiProperty({
    type: [String],
    example: ['Organik', 'Manis'],
    description: 'Label kosmetik di kartu produk.',
  })
  tags: string[];

  @ApiProperty({
    example: 8,
    nullable: true,
    description: 'Persen diskon dibulatkan. TURUNAN dari originalPrice; null bila tidak promo.',
  })
  discountPercent: number | null;

  @ApiProperty({
    description: 'TURUNAN: true bila originalPrice terisi dan lebih besar dari price.',
  })
  isPromo: boolean;

  @ApiProperty({
    description: 'TURUNAN: true bila produk dibuat dalam 14 hari terakhir.',
  })
  isNew: boolean;

  @ApiProperty({ nullable: true, example: 'kg' })
  unit: string | null;

  @ApiProperty({ nullable: true, description: 'Kode barcode/SKU' })
  barcode: string | null;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({
    description:
      'Stok. Bila query menyertakan outletId → stok outlet itu; jika tidak → total semua outlet.',
  })
  stock: number;

  @ApiPropertyOptional({
    type: [OutletStockResponseDto],
    description: 'Rincian stok per outlet (disertakan pada endpoint admin).',
  })
  outletStocks?: OutletStockResponseDto[];

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ description: 'Produk unggulan (Produk Pilihan)' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Produk timbangan (dijual per berat, qty desimal)' })
  soldByWeight: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
