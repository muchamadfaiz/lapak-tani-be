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
  // Teks bilah CTA "Chat admin" yang menempel di atas beranda storefront.
  shopCtaBarText: 'shop_cta_bar_text',
  // Judul tab browser & favicon — dipakai storefront DAN portal admin.
  siteTitle: 'site_title',
  faviconUrl: 'favicon_url',
  // Tema: warna merek (primer) & aksen (sekunder), tangga 50-950 masing-masing
  // diturunkan di frontend dari satu hex saja.
  themeBrandColor: 'theme_brand_color',
  themeSecondaryColor: 'theme_secondary_color',
  // Aturan bisnis: ongkir & poin. Sebelumnya konstanta yang ditulis mati di
  // BE DAN di frontend, jadi sekali berubah ada tiga tempat yang harus ingat.
  shippingMin: 'shipping_min',
  shippingRateInstant: 'shipping_rate_instant',
  shippingRateScheduled: 'shipping_rate_scheduled',
  pointPerRupiah: 'point_per_rupiah',
  // Gaya bahasa asisten CS.
  chatLanguage: 'chat_language',
  // ── Kredensial gerbang pembayaran (Xendit) ──
  // Dipindah dari .env ke sini supaya pemilik toko bisa mengganti sendiri dari
  // dashboard tanpa menyentuh server. Dua kunci di bawah RAHASIA: disimpan
  // terenkripsi dan tidak pernah ikut dalam payload publik mana pun.
  xenditEnabled: 'xendit_enabled',
  xenditSecretKey: 'xendit_secret_key',
  xenditCallbackToken: 'xendit_callback_token',
  xenditInvoiceDurationSec: 'xendit_invoice_duration_sec',
  paymentSuccessUrl: 'payment_success_url',
  paymentFailureUrl: 'payment_failure_url',
  // ── Kredensial pengirim OTP WhatsApp (Fonnte) ──
  // Sama alasannya dengan Xendit: pemilik toko harus bisa mengganti token
  // sendiri saat perangkat WA-nya berganti, tanpa menyentuh server.
  // Twilio (SMS) SENGAJA tidak ikut — tetap di env, karena kanal SMS tidak
  // dipakai dan menampilkannya di dashboard hanya membuka pilihan yang
  // kredensialnya kosong.
  otpEnabled: 'otp_enabled',
  otpChannel: 'otp_channel',
  fonnteToken: 'fonnte_token',
  waBusinessNumber: 'wa_business_number',
  waLoginWebhookToken: 'wa_login_webhook_token',
} as const;

/**
 * Kanal OTP yang boleh dipilih DARI DASHBOARD. `sms` sengaja tidak ada di
 * sini: kredensial Twilio masih di env, jadi memilihnya dari dashboard hanya
 * menghasilkan OTP yang gagal kirim diam-diam. Nilai `sms` yang sudah
 * telanjur diset lewat env tetap dihormati saat dibaca.
 */
export const OTP_CHANNELS_DASHBOARD = ['whatsapp', 'screen'] as const;
export type OtpChannel = 'whatsapp' | 'sms' | 'screen';

/**
 * Kunci pengaturan yang isinya RAHASIA. Nilainya dienkripsi sebelum masuk DB
 * dan hanya boleh keluar server dalam bentuk tersamar. Daftar ini dipakai
 * SettingService sebagai satu-satunya penentu apa yang perlu dienkripsi.
 */
export const SECRET_SETTING_KEYS: readonly string[] = [
  SETTING_KEYS.xenditSecretKey,
  SETTING_KEYS.xenditCallbackToken,
  SETTING_KEYS.fonnteToken,
  SETTING_KEYS.waLoginWebhookToken,
];

/** Bahasa jawaban asisten CS. */
export const CHAT_LANGUAGES = ['id', 'palembang'] as const;
export type ChatLanguage = (typeof CHAT_LANGUAGES)[number];

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
  /**
   * Teks bilah CTA "Chat admin" di puncak beranda storefront. Kosong =
   * frontend memakai kalimat bawaannya sendiri.
   */
  ctaBarText: string;
  /**
   * Judul tab browser. Kosong = frontend memakai nama toko, lalu judul bawaan
   * di index.html. Dipisah dari `name` karena judul tab biasanya lebih panjang
   * dan memuat kata kunci (mis. "Lapak Tani | Sayur Segar Palembang").
   */
  siteTitle: string;
  /**
   * URL favicon. Kosong = pakai favicon bawaan; SENGAJA tidak jatuh ke
   * `logoUrl`, karena logo toko umumnya PNG putih transparan yang hilang di
   * tab browser berlatar terang.
   */
  faviconUrl: string;
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
 * Tema. Admin memilih dua warna — merek (primer) & aksen (sekunder); tangga
 * 50-950 masing-masing diturunkan frontend dengan terang-gelap dipatok,
 * sehingga kontras teks tak bisa dirusak dari dashboard. Kosong = pakai
 * warna bawaan.
 */
export interface ThemeSettings {
  /** Hex 6 digit berawalan '#', mis. '#1f8a38'. */
  brandColor: string;
  /** Warna aksen (badge Promo/Baru, tombol tambah keranjang, harga diskon). */
  secondaryColor: string;
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
  /** Bahasa asisten CS — dipakai juga frontend untuk sapaan & contoh pertanyaan. */
  chat: { language: ChatLanguage };
}

/**
 * Kredensial gerbang pembayaran, sudah didekripsi. HANYA untuk dipakai di
 * dalam server (modul Payment) — jangan pernah dikembalikan lewat HTTP.
 */
export interface XenditCredentials {
  /** Saklar admin: gerbang dipakai atau tidak, terpisah dari ada/tidaknya kunci. */
  enabled: boolean;
  secretKey: string;
  /** Nilai header `x-callback-token` untuk memverifikasi webhook. */
  callbackToken: string;
  invoiceDurationSec: number;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

/**
 * Kredensial pengirim OTP WhatsApp, sudah didekripsi. HANYA untuk dipakai di
 * dalam server (modul OTP) — jangan pernah dikembalikan lewat HTTP.
 */
export interface OtpCredentials {
  enabled: boolean;
  channel: OtpChannel;
  /** Token Fonnte. Kosong = WhatsApp tidak bisa mengirim apa pun. */
  fonnteToken: string;
  /** Nomor WA bisnis tujuan "login instan" (reverse-OTP). */
  waBusinessNumber: string;
  /** Secret yang dicek di webhook pesan masuk WA (anti-pemalsuan). */
  waLoginWebhookToken: string;
}

/**
 * Batas publik modul Setting. Modul lain (mis. Payment) hanya butuh tahu
 * apakah pembayaran online aktif — bukan seluruh CRUD pengaturan.
 */
export abstract class SettingContract {
  /**
   * Kredensial OTP WhatsApp terkini (sudah didekripsi). Sama seperti Xendit:
   * dibaca dari DB, jatuh ke env selama admin belum pernah menyimpannya.
   */
  abstract getOtpCredentials(): Promise<OtpCredentials>;

  /**
   * Kredensial Xendit terkini (sudah didekripsi). Dibaca dari DB; bila admin
   * belum pernah menyimpan apa pun, jatuh ke variabel env lama supaya
   * pemasangan yang sudah berjalan tidak berubah perilakunya.
   */
  abstract getXenditCredentials(): Promise<XenditCredentials>;

  /** true bila pembayaran online diaktifkan admin (default: true). */
  abstract isOnlinePaymentEnabled(): Promise<boolean>;

  /** Pengaturan pembayaran untuk ditampilkan ke pelanggan. */
  abstract getPublicPaymentSettings(): Promise<PublicPaymentSettings>;

  /**
   * Aturan ongkir & poin. Dipakai modul Order saat menghitung tagihan, jadi
   * modul lain tak perlu tahu bentuk penyimpanan pengaturan.
   */
  abstract getBusinessRules(): Promise<BusinessRules>;

  /** Bahasa jawaban asisten CS. Dipakai modul Chatbot. */
  abstract getChatLanguage(): Promise<ChatLanguage>;
}
