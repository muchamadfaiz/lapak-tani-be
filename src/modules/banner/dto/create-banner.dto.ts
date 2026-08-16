import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBannerDto {
  @ApiPropertyOptional({
    example: 'Promo Ramadan 2025',
    description: 'Kosongkan untuk banner murni gambar (tanpa judul/deskripsi/tombol).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Diskon 20% untuk semua produk segar' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL gambar banner' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'URL tujuan saat banner diklik' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Urutan tampil (kecil = duluan)' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Tanggal mulai tayang (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal selesai tayang (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Gradient gelap di atas gambar (agar judul terbaca). Matikan untuk gambar polos.',
  })
  @IsOptional()
  @IsBoolean()
  overlayEnabled?: boolean;

  @ApiPropertyOptional({
    default: 55,
    description: 'Intensitas gradient, 0 (tak kelihatan) - 100 (gelap penuh).',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  overlayOpacity?: number;
}
