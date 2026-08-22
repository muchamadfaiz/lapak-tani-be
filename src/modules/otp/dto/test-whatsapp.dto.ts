import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TestWhatsappDto {
  @ApiPropertyOptional({
    description:
      'Token Fonnte yang ingin diuji. Kosongkan untuk menguji token yang ' +
      'sudah tersimpan. Diisi agar admin bisa memeriksa token baru SEBELUM ' +
      'menyimpannya dan berisiko mematikan pengiriman OTP yang sedang jalan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fonnteToken?: string;
}
