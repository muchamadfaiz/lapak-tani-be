import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Sayuran' })
  name: string;

  @ApiProperty({ nullable: true, example: '🥬' })
  icon: string | null;

  @ApiProperty({ nullable: true, description: 'URL gambar kategori' })
  imageUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
