import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Aktifkan pembayaran online (Xendit). false = hanya transfer/cash.',
  })
  @IsOptional()
  @IsBoolean()
  onlinePaymentEnabled?: boolean;

  @ApiPropertyOptional({ example: 'BCA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Lapak Tani' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;

  // ── Bilah promo mengambang di beranda storefront ──

  @ApiPropertyOptional({
    example: true,
    description: 'Tampilkan bilah promo di beranda. Judul kosong tetap dianggap mati.',
  })
  @IsOptional()
  @IsBoolean()
  promoBarEnabled?: boolean;

  @ApiPropertyOptional({
    example: 'Diskon 20% hingga 50RB',
    description: 'Baris utama bilah promo. Ruangnya sempit — jaga tetap pendek.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  promoBarTitle?: string;

  @ApiPropertyOptional({ example: 'Belanja 75RB untuk klaim vouchernya' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  promoBarSubtitle?: string;
}
