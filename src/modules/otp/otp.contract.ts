export interface RequestOtpResult {
  sent: boolean;
  expiresInSec: number;
  /** Kode OTP — HANYA dikembalikan di non-production untuk testing. */
  devCode?: string;
}

/**
 * Batas publik modul OTP. Dipakai modul lain (mis. order untuk verifikasi
 * pembeli, auth untuk 2FA) tanpa tahu detail penyimpanan/pengiriman.
 */
export abstract class OtpContract {
  /** Apakah fitur OTP aktif (OTP_ENABLED). */
  abstract get enabled(): boolean;

  /** Buat & kirim OTP ke No HP (via WhatsApp). */
  abstract requestOtp(phone: string, purpose?: string): Promise<RequestOtpResult>;

  /** Verifikasi kode OTP. true bila valid (dan menandainya terpakai). */
  abstract verifyOtp(
    phone: string,
    code: string,
    purpose?: string,
  ): Promise<boolean>;

  /** Terbitkan token sesi-HP (JWT) setelah OTP terverifikasi. */
  abstract issuePhoneToken(phone: string): string;

  /** Validasi token sesi-HP → kembalikan { phone } kanonik, atau null. */
  abstract verifyPhoneToken(token: string): { phone: string } | null;
}
