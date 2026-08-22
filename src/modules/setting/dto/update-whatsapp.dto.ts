import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { OTP_CHANNELS_DASHBOARD } from '../setting.contract';

/**
 * Kredensial pengirim OTP WhatsApp yang boleh diubah admin.
 *
 * Sama seperti kredensial Xendit: dua field rahasia menganggap string KOSONG
 * sebagai "jangan ubah", bukan "hapus" — form tidak pernah dimuati nilai
 * aslinya, jadi tanpa aturan ini admin yang cuma mengganti nomor WA bisnis
 * akan ikut menghapus tokennya. Kirim `__CLEAR__` untuk benar-benar
 * mengosongkan.
 */
export class UpdateWhatsappDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Aktifkan verifikasi OTP. Bila mati, pelanggan tidak diminta kode sama sekali.',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    enum: OTP_CHANNELS_DASHBOARD,
    example: 'whatsapp',
    description:
      'Kanal pengiriman kode. "screen" menampilkan kode di layar tanpa ' +
      'mengirim apa pun — DEMO saja, tidak aman untuk produksi. Kanal "sms" ' +
      'sengaja tidak tersedia di sini karena kredensial Twilio masih di server.',
  })
  @IsOptional()
  @IsIn(OTP_CHANNELS_DASHBOARD as unknown as string[], {
    message: 'Kanal OTP harus "whatsapp" atau "screen"',
  })
  channel?: string;

  @ApiPropertyOptional({
    description:
      'Token perangkat dari dashboard Fonnte. Kosong = biarkan yang lama. ' +
      'Kirim "__CLEAR__" untuk menghapus.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Token Fonnte terlalu panjang (maksimal 200 karakter)' })
  fonnteToken?: string;

  @ApiPropertyOptional({
    example: '6285899731884',
    description:
      'Nomor WhatsApp bisnis tujuan "login instan", format Indonesia tanpa ' +
      'tanda plus: diawali 62, total 10-13 digit. Boleh diketik dengan +, ' +
      'spasi, atau strip — pemisahnya dibuang sebelum divalidasi & disimpan.',
  })
  @IsOptional()
  @IsString()
  // Bersihkan dulu: admin lazim mengetik "+62 858-9973-1884". Kalau pemisahnya
  // ikut dihitung, aturan "maksimal 13 digit" jadi salah menuduh.
  // Awalan '0' (08xx) diubah ke 62 supaya kebiasaan mengetik nomor lokal tidak
  // ditolak mentah-mentah.
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const digit = value.replace(/\D/g, '');
    return digit.startsWith('0') ? '62' + digit.slice(1) : digit;
  })
  @Matches(/^(62\d{8,11})?$/, {
    message:
      'Nomor WhatsApp bisnis harus diawali 62 dan panjangnya 10-13 digit ' +
      '(mis. 6285899731884). Nomor 08xx otomatis diubah ke 62.',
  })
  waBusinessNumber?: string;

  @ApiPropertyOptional({
    description:
      'Secret yang dicek saat Fonnte mengirim pesan masuk ke webhook. ' +
      'Kosong = biarkan yang lama.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Webhook token terlalu panjang (maksimal 200 karakter)' })
  waLoginWebhookToken?: string;
}
