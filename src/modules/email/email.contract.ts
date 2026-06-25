/**
 * Batas publik (public boundary) modul Email. Modul lain bergantung pada
 * kontrak abstrak ini, bukan pada EmailService langsung.
 */
export abstract class EmailContract {
  /** Apakah pengiriman email aktif (SMTP dikonfigurasi). */
  abstract readonly isEnabled: boolean;

  /** Kirim email reset password. */
  abstract sendPasswordResetEmail(
    to: string,
    resetUrl: string,
  ): Promise<void>;

  /** Kirim email verifikasi akun. */
  abstract sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<void>;
}
