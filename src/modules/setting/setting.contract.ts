/** Kunci pengaturan yang dikenal aplikasi. */
export const SETTING_KEYS = {
  onlinePaymentEnabled: 'online_payment_enabled',
  bankName: 'bank_name',
  bankAccountNumber: 'bank_account_number',
  bankAccountName: 'bank_account_name',
  // Bilah promo mengambang di atas bottom-nav beranda storefront.
  promoBarEnabled: 'promo_bar_enabled',
  promoBarTitle: 'promo_bar_title',
  promoBarSubtitle: 'promo_bar_subtitle',
} as const;

/**
 * Bilah promo mengambang di beranda. Teksnya dikelola admin — sengaja TIDAK
 * ditulis mati di frontend supaya klaim promo tidak pernah basi.
 * `enabled` false = bilah tidak dirender sama sekali.
 *
 * Murni pengumuman: tidak ada tautan, tidak bisa diklik.
 */
export interface PromoBarSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
}

/** Pengaturan pembayaran yang boleh dilihat publik (storefront & app). */
export interface PublicPaymentSettings {
  /** Bila false, opsi bayar online (Xendit) disembunyikan & ditolak BE. */
  onlinePaymentEnabled: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

/**
 * Semua pengaturan yang boleh dilihat publik: pembayaran + bilah promo.
 * Superset dari PublicPaymentSettings agar pemakai lama tidak berubah.
 */
export interface PublicSettings extends PublicPaymentSettings {
  promoBar: PromoBarSettings;
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
