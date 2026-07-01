import { ApiProperty } from '@nestjs/swagger';

export class BannerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Promo Ramadan 2025' })
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ description: 'URL gambar banner' })
  imageUrl: string;

  @ApiProperty({ nullable: true, description: 'URL tujuan saat banner diklik' })
  linkUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ nullable: true })
  startDate: Date | null;

  @ApiProperty({ nullable: true })
  endDate: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
