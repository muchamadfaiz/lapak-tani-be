import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Aktifkan pembayaran online (Xendit). false = hanya transfer/cash.',
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
    description:
      'Tampilkan bilah promo di beranda. Judul kosong tetap dianggap mati.',
  })
  @IsOptional()
  @IsBoolean()
  promoBarEnabled?: boolean;

  @ApiPropertyOptional({
    example: 'Diskon 20% hingga 50RB',
    description:
      'Baris utama bilah promo. Ruangnya sempit — jaga tetap pendek.',
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

  // ── Identitas toko ──
  // Semua opsional; kosong berarti storefront memakai bawaannya sendiri.

  @ApiPropertyOptional({ example: 'Lapak Tani' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  shopName?: string;

  @ApiPropertyOptional({
    example: 'Produk segar langsung dari petani Palembang',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shopTagline?: string;

  @ApiPropertyOptional({
    example: 'https://api.lapaktani.store/uploads/2026-07-22/logo.png',
    description: 'URL logo hasil unggah. Kosong = pakai logo bawaan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shopLogoUrl?: string;

  @ApiPropertyOptional({
    example: '6285899731884',
    description:
      'Nomor WhatsApp admin. Boleh ditulis dengan +, spasi, atau strip — ' +
      'BE menyimpannya apa adanya dan membersihkannya saat dibaca.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  shopWhatsapp?: string;

  @ApiPropertyOptional({ example: 'Senin–Sabtu, 08.00–17.00' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  shopServiceHours?: string;

  @ApiPropertyOptional({
    example: '#1f8a38',
    description:
      'Warna merek, hex 6 digit. Tangga 50–950 diturunkan frontend. ' +
      'Kosongkan untuk kembali ke warna bawaan.',
  })
  @IsOptional()
  @IsString()
  // Longgar di sini (boleh string kosong = reset); bentuk hex-nya divalidasi
  // lagi saat dibaca, jadi nilai ngawur tak pernah sampai ke tampilan.
  @Matches(/^(#[0-9a-fA-F]{6})?$/, {
    message: 'Warna merek harus hex 6 digit, mis. #1f8a38',
  })
  themeBrandColor?: string;
}
