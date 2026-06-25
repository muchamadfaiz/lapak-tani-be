import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Beras Premium Pandan Wangi 5kg' })
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 78000 })
  price: number;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  outletId: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
