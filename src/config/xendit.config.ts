import { registerAs } from '@nestjs/config';

/**
 * Konfigurasi pembayaran online via Xendit (Invoice API — halaman bayar hosted
 * yang mencakup VA, e-wallet, QRIS, kartu, retail).
 *
 * - secretKey    : dipakai Basic Auth (username = secretKey, password kosong).
 * - callbackToken: nilai header `x-callback-token` yang dikirim Xendit ke webhook.
 *                  Dipakai untuk menolak callback palsu.
 */
export default registerAs('xendit', () => ({
  enabled: process.env.XENDIT_ENABLED === 'true',
  secretKey: process.env.XENDIT_SECRET_KEY || '',
  callbackToken: process.env.XENDIT_CALLBACK_TOKEN || '',

  // Setelah bayar/gagal, Xendit mengembalikan pelanggan ke halaman ini.
  successRedirectUrl: process.env.PAYMENT_SUCCESS_URL || '',
  failureRedirectUrl: process.env.PAYMENT_FAILURE_URL || '',

  // Batas waktu bayar invoice (detik). Default 24 jam — samakan dgn expiry order.
  invoiceDurationSec: Number(process.env.XENDIT_INVOICE_DURATION_SEC || 86400),
}));
