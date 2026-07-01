import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../common';

/**
 * Query list produk: paginasi (page/limit/sortBy/order dari PageOptionsDto) +
 * filter. Default limit 10 (maks 100).
 */
export class FindProductsQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter per outlet' })
  @IsOptional()
  @IsUUID()
  outletId?: string;

  @ApiPropertyOptional({ description: 'Filter per kategori' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Cari berdasarkan nama produk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter ketersediaan (true = hanya yang tersedia)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({
    description: 'Filter unggulan (true = hanya Produk Pilihan)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;
}
