/** Kunci pengaturan yang dikenal aplikasi. */
export const SETTING_KEYS = {
  onlinePaymentEnabled: 'online_payment_enabled',
  bankName: 'bank_name',
  bankAccountNumber: 'bank_account_number',
  bankAccountName: 'bank_account_name',
} as const;

/** Pengaturan pembayaran yang boleh dilihat publik (storefront & app). */
export interface PublicPaymentSettings {
  /** Bila false, opsi bayar online (Xendit) disembunyikan & ditolak BE. */
  onlinePaymentEnabled: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

/**
 * Batas publik modul Setting. Modul lain (mis. Payment) hanya butuh tahu
 * apakah pembayaran online aktif — bukan seluruh CRUD pengaturan.
 */
export abstract class SettingContract {
  /** true bila pembayaran online diaktifkan admin (default: true). */
  abstract isOnlinePaymentEnabled(): Promise<boolean>;

  /** Pengaturan pembayaran untuk ditampilkan ke pelanggan. */
  abstract getPublicPaymentSettings(): Promise<PublicPaymentSettings>;
}
