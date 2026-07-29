import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Filter ekspor CSV — sengaja TANPA paginasi: ekspor selalu mengambil seluruh
 * produk yang cocok filter. Field-nya dibuat sama dengan filter daftar produk
 * agar "yang tampil di layar = yang terekspor".
 */
export class ExportProductsQueryDto {
  @ApiPropertyOptional({ description: 'Filter per kategori' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Cari berdasarkan nama produk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter ketersediaan' })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ description: 'Filter Produk Pilihan' })
  @IsOptional()
  @Type(() => Boolean)
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;
}
