/**
 * Batas publik modul Payment untuk modul lain (POS). Modul POS butuh membuat
 * QRIS dinamis untuk transaksi kasir, tanpa mengakses XenditService internal.
 */
export abstract class PaymentContract {
  /**
   * Buat QRIS dinamis untuk sebuah order kasir (reference_id = orderNumber).
   * Melempar bila pembayaran online belum aktif / dimatikan admin.
   */
  abstract createPosQrCode(
    orderNumber: string,
    amount: number,
  ): Promise<{ qrString: string; qrId: string; expiresAt: string | null }>;

  /** True bila Xendit dalam mode sandbox (untuk fitur simulasi bayar saat demo). */
  abstract isSandbox(): boolean;
}
