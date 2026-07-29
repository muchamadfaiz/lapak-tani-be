import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ImportProductsQueryDto {
  @ApiPropertyOptional({
    description:
      'Hanya periksa file, tidak menyimpan apa pun. Dipakai untuk pratinjau ' +
      'sebelum admin menekan "Impor".',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dryRun?: boolean;
}

/** Kesalahan pada satu baris file (baris lain tetap diproses). */
export class ImportRowErrorDto {
  @ApiProperty({ description: 'Nomor baris di file CSV (baris 1 = header)' })
  row: number;

  @ApiProperty({ example: 'Beras Premium' })
  name: string;

  @ApiProperty({ example: 'Kategori "Sembakoo" tidak ditemukan' })
  message: string;
}

export class ImportProductsResultDto {
  @ApiProperty({ description: 'Baris data yang dibaca (tanpa header)' })
  total: number;

  @ApiProperty({ description: 'Produk baru dibuat' })
  created: number;

  @ApiProperty({ description: 'Produk lama diperbarui' })
  updated: number;

  @ApiProperty({ description: 'Baris gagal (dilewati)' })
  failed: number;

  @ApiProperty({ description: 'true = belum ada yang disimpan' })
  dryRun: boolean;

  @ApiProperty({ type: [ImportRowErrorDto] })
  errors: ImportRowErrorDto[];
}
