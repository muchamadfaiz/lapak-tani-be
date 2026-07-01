import { ApiProperty } from '@nestjs/swagger';

/**
 * Produk terlaris untuk widget "Top Seller". Field produk berasal dari
 * ProductContract.findByIds (ProductRef) + `soldCount` hasil agregasi order.
 */
export class TopSellerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Beras Premium Pandan Wangi 5kg' })
  name: string;

  @ApiProperty({ example: 78000 })
  price: number;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  outletId: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ example: 42, description: 'Total unit terjual (order completed)' })
  soldCount: number;
}
