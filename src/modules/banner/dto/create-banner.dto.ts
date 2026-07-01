import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ example: 'Promo Ramadan 2025' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

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
}
