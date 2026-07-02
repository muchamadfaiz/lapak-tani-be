import { registerAs } from '@nestjs/config';

/**
 * Konfigurasi "Login instan WhatsApp" (reverse-OTP).
 * - businessNumber: nomor WA bisnis tujuan user mengirim kode.
 * - webhookToken: secret yang dicek di webhook pesan-masuk (anti palsu).
 */
export default registerAs('waLogin', () => ({
  businessNumber: process.env.WA_BUSINESS_NUMBER || '',
  webhookToken: process.env.WA_LOGIN_WEBHOOK_TOKEN || '',
  ttlSec: Number(process.env.WA_LOGIN_TTL_SEC || 300),
  codeLength: Number(process.env.WA_LOGIN_CODE_LENGTH || 6),
}));
