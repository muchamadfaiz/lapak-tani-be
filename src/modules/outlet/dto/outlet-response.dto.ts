import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OutletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'LapakTani Ilir Barat' })
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ example: -2.9735 })
  latitude: number;

  @ApiProperty({ example: 104.772 })
  longitude: number;

  @ApiProperty({ nullable: true, example: '0711-111001' })
  phone: string | null;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Jarak dari lokasi user (km). Hanya ada bila query lat & lng dikirim.',
    example: 1.8,
  })
  distance?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
