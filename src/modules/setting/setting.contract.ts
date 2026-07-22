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
  // Identitas toko — dipakai storefront (logo, nama, tautan WhatsApp).
  shopName: 'shop_name',
  shopTagline: 'shop_tagline',
  shopLogoUrl: 'shop_logo_url',
  shopWhatsapp: 'shop_whatsapp',
  shopServiceHours: 'shop_service_hours',
  // Tema: satu warna merek, tangga 50-950 diturunkan di frontend.
  themeBrandColor: 'theme_brand_color',
  // Aturan bisnis: ongkir & poin. Sebelumnya konstanta yang ditulis mati di
  // BE DAN di frontend, jadi sekali berubah ada tiga tempat yang harus ingat.
  shippingMin: 'shipping_min',
  shippingRateInstant: 'shipping_rate_instant',
  shippingRateScheduled: 'shipping_rate_scheduled',
  pointPerRupiah: 'point_per_rupiah',
} as const;

/**
 * Aturan ongkir & poin. BE tetap satu-satunya yang MENGHITUNG dan menagih;
 * frontend membaca nilai ini hanya untuk menampilkan, supaya angka di layar
 * dan angka yang ditagih tak mungkin berbeda.
 */
export interface BusinessRules {
  /** Ongkir minimum (Rupiah), berlaku walau jaraknya sangat dekat. */
  shippingMin: number;
  /** Tarif per km untuk pengiriman instan. */
  shippingRateInstant: number;
  /** Tarif per km untuk pengiriman terjadwal (pagi/sore). */
  shippingRateScheduled: number;
  /** Rupiah belanja per 1 poin. */
  pointPerRupiah: number;
}

/**
 * Identitas toko. Sebelumnya tersebar sebagai konstanta di banyak berkas —
 * nomor WhatsApp saja ditulis mati di 5 file frontend, sehingga sekali ganti
 * nomor ada enam tempat yang harus diingat.
 *
 * Nilai kosong berarti "pakai bawaan frontend", bukan "kosongkan tampilan".
 */
export interface ShopIdentity {
  name: string;
  tagline: string;
  /** URL logo hasil unggah admin. Kosong = pakai logo bawaan. */
  logoUrl: string;
  /** Nomor WhatsApp admin, format internasional tanpa '+' (mis. 6285...). */
  whatsapp: string;
  serviceHours: string;
}

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
 * Tema. Admin hanya memilih SATU warna; tangga 50-950 diturunkan frontend
 * dengan terang-gelap dipatok, sehingga kontras teks tak bisa dirusak dari
 * dashboard. Kosong = pakai warna bawaan.
 */
export interface ThemeSettings {
  /** Hex 6 digit berawalan '#', mis. '#1f8a38'. */
  brandColor: string;
}

/**
 * Semua pengaturan yang boleh dilihat publik: pembayaran, bilah promo,
 * identitas toko, dan tema. Superset dari PublicPaymentSettings agar pemakai
 * lama tidak berubah.
 */
export interface PublicSettings extends PublicPaymentSettings {
  promoBar: PromoBarSettings;
  shop: ShopIdentity;
  theme: ThemeSettings;
  rules: BusinessRules;
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

  /**
   * Aturan ongkir & poin. Dipakai modul Order saat menghitung tagihan, jadi
   * modul lain tak perlu tahu bentuk penyimpanan pengaturan.
   */
  abstract getBusinessRules(): Promise<BusinessRules>;
}
