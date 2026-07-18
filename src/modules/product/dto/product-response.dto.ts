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

  @ApiProperty({ nullable: true, example: 'kg' })
  unit: string | null;

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
