import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Beras Premium Pandan Wangi 5kg' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Beras putih premium, harum dan pulen' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 78000, description: 'Harga (Rupiah, tanpa desimal)' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'URL gambar produk' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID kategori' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'ID outlet' })
  @IsUUID()
  outletId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
