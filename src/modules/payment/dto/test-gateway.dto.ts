import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TestGatewayDto {
  @ApiPropertyOptional({
    example: 'xnd_development_...',
    description:
      'Secret Key yang ingin diuji. Kosongkan untuk menguji kunci yang ' +
      'sudah tersimpan. Diisi agar admin bisa memeriksa kunci baru SEBELUM ' +
      'menyimpannya dan berisiko mematikan pembayaran yang sedang berjalan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secretKey?: string;
}
