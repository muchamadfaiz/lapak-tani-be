import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Kredensial gerbang pembayaran yang boleh diubah admin dari dashboard.
 *
 * Aturan penting untuk dua field rahasia: string KOSONG berarti "jangan ubah",
 * bukan "hapus". Form di dashboard memang tidak pernah dimuati nilai asli
 * (server tak pernah mengirimkannya), jadi tanpa aturan ini admin yang hanya
 * ingin mengubah durasi invoice akan ikut menghapus kunci pembayarannya.
 * Untuk benar-benar mengosongkan, kirim nilai `__CLEAR__`.
 */
export class UpdateGatewayDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Nyalakan gerbang Xendit. Terpisah dari onlinePaymentEnabled yang ' +
      'mengatur tampil/tidaknya opsi bayar online ke pelanggan.',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    example: 'xnd_development_xxx',
    description:
      'Secret Key dari dashboard Xendit. Kosong = biarkan yang lama. ' +
      'Kirim "__CLEAR__" untuk menghapus.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Secret Key terlalu panjang (maksimal 200 karakter)' })
  // Longgar tapi bukan bebas: hanya kunci Xendit yang sah (atau penanda hapus,
  // atau kosong) yang diterima — salah tempel nilai ketahuan saat menyimpan,
  // bukan nanti saat ada pelanggan yang gagal bayar.
  @Matches(/^(|__CLEAR__|xnd_(development|production)_[A-Za-z0-9+/_=-]+)$/, {
    message:
      'Secret Key tidak dikenali. Buka dashboard Xendit → Settings → API Keys, ' +
      'lalu salin ulang kuncinya. Kunci yang benar diawali "xnd_development_" ' +
      'untuk mode uji coba, atau "xnd_production_" untuk pembayaran sungguhan',
  })
  secretKey?: string;

  @ApiPropertyOptional({
    description:
      'Nilai header x-callback-token dari Settings > Webhooks di Xendit. ' +
      'Wajib diisi agar webhook bisa diverifikasi. Kosong = biarkan yang lama.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Callback Token terlalu panjang (maksimal 200 karakter)' })
  callbackToken?: string;

  @ApiPropertyOptional({
    example: 86400,
    description: 'Batas waktu bayar invoice (detik). Minimal 1 jam.',
  })
  @IsOptional()
  // Pesan ditulis dalam satuan JAM — itu yang diisi admin di dashboard;
  // detik hanya bentuk kirimannya.
  @IsInt({ message: 'Batas waktu bayar harus berupa angka bulat' })
  @Min(3600, { message: 'Batas waktu bayar minimal 1 jam' })
  @Max(2_592_000, { message: 'Batas waktu bayar maksimal 30 hari (720 jam)' })
  invoiceDurationSec?: number;

  @ApiPropertyOptional({
    example: 'https://lapaktani.store/pesanan/sukses',
    description: 'Tujuan pelanggan setelah berhasil bayar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Alamat halaman berhasil bayar terlalu panjang' })
  successRedirectUrl?: string;

  @ApiPropertyOptional({
    example: 'https://lapaktani.store/pesanan/gagal',
    description: 'Tujuan pelanggan setelah gagal/batal bayar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Alamat halaman gagal bayar terlalu panjang' })
  failureRedirectUrl?: string;
}
