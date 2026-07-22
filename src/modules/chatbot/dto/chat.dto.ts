import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    example: 'Ada bayam segar nggak?',
    description: 'Pesan dari pelanggan.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500, { message: 'Pesan terlalu panjang (maks 500 karakter)' })
  message: string;

  @ApiPropertyOptional({
    description:
      'ID giliran sebelumnya, dikembalikan oleh respons chat. Kirim balik agar ' +
      'percakapan nyambung; kosongkan untuk memulai percakapan baru.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previousInteractionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({ example: 'Ada! Bayam Hijau Segar 500g Rp8.000 per ikat.' })
  reply: string;

  @ApiProperty({
    nullable: true,
    description:
      'Kirim balik di permintaan berikutnya agar percakapan nyambung.',
  })
  interactionId: string | null;
}
