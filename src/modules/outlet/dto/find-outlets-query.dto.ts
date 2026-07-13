import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Query opsional untuk GET /outlets. Bila `lat` & `lng` diisi (lokasi user),
 * response menambah `distance` (km) per outlet dan diurut dari terdekat.
 */
export class FindOutletsQueryDto {
  @ApiPropertyOptional({ example: -2.9761, description: 'Latitude lokasi user' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: 104.7754, description: 'Longitude lokasi user' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    default: false,
    description:
      'Sertakan gudang. Default false → storefront hanya melihat outlet jualan.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeWarehouse?: boolean;
}
