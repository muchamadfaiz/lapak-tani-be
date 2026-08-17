import { Injectable } from '@nestjs/common';
import {
  dekripsiRahasia,
  enkripsiAktif,
  enkripsiRahasia,
  samarkanRahasia,
} from '../../common/utils';
import { SettingRepository } from './repository/setting.repository';
import {
  BusinessRules,
  CHAT_LANGUAGES,
  ChatLanguage,
  OtpChannel,
  OtpCredentials,
  PublicPaymentSettings,
  PublicSettings,
  SECRET_SETTING_KEYS,
  SETTING_KEYS,
  SettingContract,
  XenditCredentials,
} from './setting.contract';

/** Nilai bawaan bila admin belum pernah menyimpan pengaturan. */
const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.onlinePaymentEnabled]: 'true',
  [SETTING_KEYS.bankName]: '',
  [SETTING_KEYS.bankAccountNumber]: '',
  [SETTING_KEYS.bankAccountName]: '',
  // Bilah promo default MATI — jangan pernah menayangkan klaim diskon yang
  // belum pernah diisi admin.
  [SETTING_KEYS.promoBarEnabled]: 'false',
  [SETTING_KEYS.promoBarTitle]: '',
  [SETTING_KEYS.promoBarSubtitle]: '',
  // Identitas: kosong = frontend memakai bawaannya sendiri. Nomor WhatsApp
  // mengambil env yang sudah dipakai modul Order agar keduanya tidak berbeda
  // sebelum admin pernah menyimpan apa pun.
  [SETTING_KEYS.shopName]: '',
  [SETTING_KEYS.shopTagline]: '',
  [SETTING_KEYS.shopLogoUrl]: '',
  [SETTING_KEYS.shopWhatsapp]: process.env.WHATSAPP_ADMIN_NUMBER || '',
  [SETTING_KEYS.shopServiceHours]: '',
  [SETTING_KEYS.shopCtaBarText]: '',
  [SETTING_KEYS.siteTitle]: '',
  [SETTING_KEYS.faviconUrl]: '',
  // Kosong = frontend memakai palet bawaannya.
  [SETTING_KEYS.themeBrandColor]: '',
  [SETTING_KEYS.themeSecondaryColor]: '',
  // Bawaan = nilai konstanta yang dulu ditulis mati, supaya perilaku tak
  // berubah sebelum admin menyentuh apa pun.
  [SETTING_KEYS.shippingMin]: '5000',
  [SETTING_KEYS.shippingRateInstant]: '10000',
  [SETTING_KEYS.shippingRateScheduled]: '2000',
  [SETTING_KEYS.pointPerRupiah]: '1000',
  // Bawaan Bahasa Indonesia — netral. Dialek daerah sengaja BUKAN bawaan:
  // kalau aplikasi ini dipakai kota lain dan admin lupa mengubahnya, bot
  // akan bicara dengan dialek yang salah tempat.
  [SETTING_KEYS.chatLanguage]: 'id',
};

/**
 * Aturan bisnis dibaca SETIAP kali order dibuat. Tanpa cache, tiap checkout
 * menambah satu query yang isinya nyaris tak pernah berubah. TTL dibuat
 * pendek supaya perubahan admin tetap terasa cepat.
 */
const RULES_TTL_MS = 30_000;

@Injectable()
export class SettingService extends SettingContract {
  private rulesCache: { nilai: BusinessRules; sampai: number } | null = null;

  constructor(private readonly repo: SettingRepository) {
    super();
  }

  /** Angka dari pengaturan; jatuh ke bawaan bila kosong/bukan angka wajar. */
  private static angka(raw: string | undefined, bawaan: number): number {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : bawaan;
  }

  /** Semua pengaturan (admin) — default diisi bila belum ada di DB. */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.repo.findAll();
    const map = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  }

  /** Simpan sebagian pengaturan. Hanya key yang dikenal yang diterima. */
  async getBusinessRules(): Promise<BusinessRules> {
    if (this.rulesCache && Date.now() < this.rulesCache.sampai) {
      return this.rulesCache.nilai;
    }
    const all = await this.getAll();
    const nilai: BusinessRules = {
      shippingMin: SettingService.angka(all[SETTING_KEYS.shippingMin], 5000),
      shippingRateInstant: SettingService.angka(
        all[SETTING_KEYS.shippingRateInstant],
        10000,
      ),
      shippingRateScheduled: SettingService.angka(
        all[SETTING_KEYS.shippingRateScheduled],
        2000,
      ),
      // Pembagi tak boleh 0 — akan menghasilkan Infinity poin.
      pointPerRupiah: Math.max(
        1,
        SettingService.angka(all[SETTING_KEYS.pointPerRupiah], 1000),
      ),
    };
    this.rulesCache = { nilai, sampai: Date.now() + RULES_TTL_MS };
    return nilai;
  }

  async getChatLanguage(): Promise<ChatLanguage> {
    const map = await this.repo.findMany([SETTING_KEYS.chatLanguage]);
    const raw = map.get(SETTING_KEYS.chatLanguage) ?? 'id';
    return (CHAT_LANGUAGES as readonly string[]).includes(raw)
      ? (raw as ChatLanguage)
      : 'id';
  }

  /**
   * Tulis satu pengaturan. Nilai yang tergolong rahasia dienkripsi lebih dulu —
   * satu-satunya jalan menulis ke tabel, jadi tidak mungkin ada rahasia yang
   * lolos tersimpan sebagai teks biasa karena lupa dienkripsi di pemanggil.
   */
  private async simpan(key: string, value: string): Promise<void> {
    const nilai = SECRET_SETTING_KEYS.includes(key)
      ? enkripsiRahasia(value)
      : value;
    await this.repo.upsert(key, nilai);
  }

  async update(patch: Record<string, string>): Promise<Record<string, string>> {
    // Perubahan harus langsung terasa, jangan menunggu TTL habis.
    this.rulesCache = null;
    const known = new Set<string>(Object.values(SETTING_KEYS));
    for (const [key, value] of Object.entries(patch)) {
      if (!known.has(key)) continue; // abaikan key asing (anti-sampah)
      await this.simpan(key, String(value));
    }
    return this.getAll();
  }

  // ── Pengirim OTP WhatsApp (Fonnte) ────────────────────────────────────────

  async getOtpCredentials(): Promise<OtpCredentials> {
    const map = await this.repo.findMany([
      SETTING_KEYS.otpEnabled,
      SETTING_KEYS.otpChannel,
      SETTING_KEYS.fonnteToken,
      SETTING_KEYS.waBusinessNumber,
      SETTING_KEYS.waLoginWebhookToken,
    ]);

    // Aturan cadangan sama seperti Xendit: env hanya dipakai selama BARISNYA
    // belum ada. Begitu admin pernah menyimpan, isinya dipatuhi apa adanya.
    const enabledRaw = map.get(SETTING_KEYS.otpEnabled);
    const channelRaw =
      map.get(SETTING_KEYS.otpChannel) ?? process.env.OTP_CHANNEL ?? 'whatsapp';
    const tokenRow = map.get(SETTING_KEYS.fonnteToken);
    const webhookRow = map.get(SETTING_KEYS.waLoginWebhookToken);

    return {
      enabled:
        enabledRaw === undefined
          ? process.env.OTP_ENABLED === 'true'
          : enabledRaw === 'true',
      // Nilai asing (mis. salah ketik di env) jangan sampai mematikan OTP
      // diam-diam — jatuhkan ke 'whatsapp', kanal yang memang dipakai.
      channel: (['whatsapp', 'sms', 'screen'] as const).includes(
        channelRaw as OtpChannel,
      )
        ? (channelRaw as OtpChannel)
        : 'whatsapp',
      fonnteToken:
        tokenRow === undefined
          ? process.env.FONNTE_TOKEN || ''
          : dekripsiRahasia(tokenRow),
      waBusinessNumber:
        map.get(SETTING_KEYS.waBusinessNumber) ??
        process.env.WA_BUSINESS_NUMBER ??
        '',
      waLoginWebhookToken:
        webhookRow === undefined
          ? process.env.WA_LOGIN_WEBHOOK_TOKEN || ''
          : dekripsiRahasia(webhookRow),
    };
  }

  /** Bentuk yang boleh dilihat admin: token hanya 4 karakter terakhir. */
  async getOtpAdminView(): Promise<{
    enabled: boolean;
    channel: OtpChannel;
    /** true bila kanal saat ini diatur lewat env dan tak ada di pilihan dashboard. */
    channelManagedByServer: boolean;
    fonnteTokenMasked: string;
    fonnteTokenConfigured: boolean;
    waBusinessNumber: string;
    waLoginWebhookTokenMasked: string;
    waLoginWebhookTokenConfigured: boolean;
    encryptionActive: boolean;
    credentialsUpdatedAt: string | null;
  }> {
    const c = await this.getOtpCredentials();
    const terakhir = await this.repo.findLastUpdatedAt([
      SETTING_KEYS.fonnteToken,
      SETTING_KEYS.waLoginWebhookToken,
    ]);
    return {
      enabled: c.enabled,
      channel: c.channel,
      channelManagedByServer: c.channel === 'sms',
      fonnteTokenMasked: samarkanRahasia(c.fonnteToken),
      fonnteTokenConfigured: c.fonnteToken.length > 0,
      waBusinessNumber: c.waBusinessNumber,
      waLoginWebhookTokenMasked: samarkanRahasia(c.waLoginWebhookToken),
      waLoginWebhookTokenConfigured: c.waLoginWebhookToken.length > 0,
      encryptionActive: enkripsiAktif(),
      credentialsUpdatedAt: terakhir ? terakhir.toISOString() : null,
    };
  }

  /**
   * Simpan kredensial OTP. Aturan sama seperti Xendit: field `undefined` tidak
   * disentuh, dan dua token rahasia menganggap string kosong sebagai "biarkan
   * yang lama" — kirim `__CLEAR__` untuk benar-benar menghapus.
   */
  async updateOtp(patch: {
    enabled?: boolean;
    channel?: string;
    fonnteToken?: string;
    waBusinessNumber?: string;
    waLoginWebhookToken?: string;
  }): Promise<void> {
    if (patch.enabled !== undefined) {
      await this.simpan(SETTING_KEYS.otpEnabled, String(patch.enabled));
    }
    if (patch.channel !== undefined) {
      await this.simpan(SETTING_KEYS.otpChannel, patch.channel);
    }
    if (patch.waBusinessNumber !== undefined) {
      await this.simpan(
        SETTING_KEYS.waBusinessNumber,
        patch.waBusinessNumber.trim(),
      );
    }
    for (const [field, key] of [
      ['fonnteToken', SETTING_KEYS.fonnteToken],
      ['waLoginWebhookToken', SETTING_KEYS.waLoginWebhookToken],
    ] as const) {
      const nilai = patch[field];
      if (nilai === undefined || nilai === '') continue; // kosong = jangan ubah
      await this.simpan(key, nilai === '__CLEAR__' ? '' : nilai.trim());
    }
  }

  // ── Gerbang pembayaran (Xendit) ───────────────────────────────────────────

  async getXenditCredentials(): Promise<XenditCredentials> {
    const map = await this.repo.findMany([
      SETTING_KEYS.xenditEnabled,
      SETTING_KEYS.xenditSecretKey,
      SETTING_KEYS.xenditCallbackToken,
      SETTING_KEYS.xenditInvoiceDurationSec,
      SETTING_KEYS.paymentSuccessUrl,
      SETTING_KEYS.paymentFailureUrl,
    ]);

    // Env hanya dipakai bila BARISNYA BELUM ADA — artinya admin belum pernah
    // menyentuh field itu. Begitu ada baris, isinya dipatuhi apa adanya,
    // termasuk bila sengaja dikosongkan: kalau tidak, admin yang menghapus
    // kunci akan diam-diam diisi ulang oleh env dan mengira kuncinya terhapus.
    const enabledRaw = map.get(SETTING_KEYS.xenditEnabled);
    const secretRow = map.get(SETTING_KEYS.xenditSecretKey);
    const secretKey =
      secretRow === undefined
        ? process.env.XENDIT_SECRET_KEY || ''
        : dekripsiRahasia(secretRow);
    const tokenRow = map.get(SETTING_KEYS.xenditCallbackToken);
    const callbackToken =
      tokenRow === undefined
        ? process.env.XENDIT_CALLBACK_TOKEN || ''
        : dekripsiRahasia(tokenRow);
    const durasiRaw =
      map.get(SETTING_KEYS.xenditInvoiceDurationSec) ??
      process.env.XENDIT_INVOICE_DURATION_SEC;

    return {
      enabled:
        enabledRaw === undefined
          ? process.env.XENDIT_ENABLED === 'true'
          : enabledRaw === 'true',
      secretKey,
      callbackToken,
      // Minimal 1 jam: invoice yang kedaluwarsa dalam hitungan detik hanya
      // menghasilkan order gagal bayar.
      invoiceDurationSec: Math.max(
        3600,
        SettingService.angka(durasiRaw, 86400),
      ),
      successRedirectUrl:
        map.get(SETTING_KEYS.paymentSuccessUrl) ??
        process.env.PAYMENT_SUCCESS_URL ??
        '',
      failureRedirectUrl:
        map.get(SETTING_KEYS.paymentFailureUrl) ??
        process.env.PAYMENT_FAILURE_URL ??
        '',
    };
  }

  /**
   * Bentuk kredensial yang boleh dilihat admin di dashboard: kunci hanya
   * ditampilkan 4 karakter terakhir. Nilai penuh tidak pernah keluar server.
   */
  async getXenditAdminView(): Promise<{
    enabled: boolean;
    secretKeyMasked: string;
    secretKeyConfigured: boolean;
    callbackTokenMasked: string;
    callbackTokenConfigured: boolean;
    invoiceDurationSec: number;
    successRedirectUrl: string;
    failureRedirectUrl: string;
    mode: 'test' | 'live' | 'unset';
    encryptionActive: boolean;
    /** ISO, atau null bila kredensial masih berasal dari env server. */
    credentialsUpdatedAt: string | null;
  }> {
    const c = await this.getXenditCredentials();
    const terakhir = await this.repo.findLastUpdatedAt([
      SETTING_KEYS.xenditSecretKey,
      SETTING_KEYS.xenditCallbackToken,
    ]);
    return {
      credentialsUpdatedAt: terakhir ? terakhir.toISOString() : null,
      enabled: c.enabled,
      secretKeyMasked: samarkanRahasia(c.secretKey),
      secretKeyConfigured: c.secretKey.length > 0,
      callbackTokenMasked: samarkanRahasia(c.callbackToken),
      callbackTokenConfigured: c.callbackToken.length > 0,
      invoiceDurationSec: c.invoiceDurationSec,
      successRedirectUrl: c.successRedirectUrl,
      failureRedirectUrl: c.failureRedirectUrl,
      mode: !c.secretKey
        ? 'unset'
        : c.secretKey.startsWith('xnd_development')
          ? 'test'
          : 'live',
      encryptionActive: enkripsiAktif(),
    };
  }

  /**
   * Simpan kredensial gerbang. Field yang `undefined` tidak disentuh; khusus
   * dua kunci rahasia, string kosong juga berarti "biarkan yang lama" — kalau
   * tidak, admin yang menekan Simpan setelah mengubah hal lain akan menghapus
   * kunci pembayaran tanpa sadar (form memang tidak pernah memuat nilai asli).
   * Untuk benar-benar menghapus, kirim nilai khusus `__CLEAR__`.
   */
  async updateXendit(patch: {
    enabled?: boolean;
    secretKey?: string;
    callbackToken?: string;
    invoiceDurationSec?: number;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }): Promise<void> {
    if (patch.enabled !== undefined) {
      await this.simpan(SETTING_KEYS.xenditEnabled, String(patch.enabled));
    }
    for (const [field, key] of [
      ['secretKey', SETTING_KEYS.xenditSecretKey],
      ['callbackToken', SETTING_KEYS.xenditCallbackToken],
    ] as const) {
      const nilai = patch[field];
      if (nilai === undefined || nilai === '') continue; // kosong = jangan ubah
      await this.simpan(key, nilai === '__CLEAR__' ? '' : nilai.trim());
    }
    if (patch.invoiceDurationSec !== undefined) {
      await this.simpan(
        SETTING_KEYS.xenditInvoiceDurationSec,
        String(patch.invoiceDurationSec),
      );
    }
    if (patch.successRedirectUrl !== undefined) {
      await this.simpan(
        SETTING_KEYS.paymentSuccessUrl,
        patch.successRedirectUrl.trim(),
      );
    }
    if (patch.failureRedirectUrl !== undefined) {
      await this.simpan(
        SETTING_KEYS.paymentFailureUrl,
        patch.failureRedirectUrl.trim(),
      );
    }
  }

  async isOnlinePaymentEnabled(): Promise<boolean> {
    const map = await this.repo.findMany([SETTING_KEYS.onlinePaymentEnabled]);
    const raw = map.get(SETTING_KEYS.onlinePaymentEnabled);
    // Belum pernah diset → default aktif (perilaku lama tak berubah).
    return raw === undefined ? true : raw === 'true';
  }

  /**
   * True bila gerbang benar-benar siap menerima pembayaran: dinyalakan admin
   * DAN kuncinya terisi. Dipakai untuk memastikan storefront tidak pernah
   * menawarkan "Bayar Online" yang pasti gagal.
   */
  private async gerbangSiap(): Promise<boolean> {
    const c = await this.getXenditCredentials();
    return c.enabled && c.secretKey.length > 0;
  }

  /**
   * @param efektif true (bawaan) = untuk pelanggan: `onlinePaymentEnabled`
   * digabung dengan kesiapan gerbang, sehingga opsi bayar online hanya muncul
   * bila benar-benar bisa dipakai. false = untuk dashboard admin: kembalikan
   * NIAT admin apa adanya, kalau tidak sakelarnya akan terlihat mati sendiri
   * saat kredensial belum diisi.
   */
  async getPublicPaymentSettings(efektif = true): Promise<PublicPaymentSettings> {
    const all = await this.getAll();
    const niat = all[SETTING_KEYS.onlinePaymentEnabled] === 'true';
    // Untuk admin: niat apa adanya. Untuk pelanggan: niat DAN gerbang siap.
    const online = !efektif ? niat : niat && (await this.gerbangSiap());
    return {
      onlinePaymentEnabled: online,
      bankName: all[SETTING_KEYS.bankName],
      bankAccountNumber: all[SETTING_KEYS.bankAccountNumber],
      bankAccountName: all[SETTING_KEYS.bankAccountName],
    };
  }

  /** Pembayaran + bilah promo, untuk storefront & halaman pengaturan admin. */
  async getPublicSettings(efektif = true): Promise<PublicSettings> {
    const all = await this.getAll();
    const title = all[SETTING_KEYS.promoBarTitle].trim();
    return {
      ...(await this.getPublicPaymentSettings(efektif)),
      promoBar: {
        // Judul kosong = tak ada yang bisa ditampilkan, jadi anggap mati
        // walau saklarnya menyala. Storefront tak perlu memeriksa dua hal.
        enabled:
          all[SETTING_KEYS.promoBarEnabled] === 'true' && title.length > 0,
        title,
        subtitle: all[SETTING_KEYS.promoBarSubtitle].trim(),
      },
      shop: {
        name: all[SETTING_KEYS.shopName].trim(),
        tagline: all[SETTING_KEYS.shopTagline].trim(),
        logoUrl: all[SETTING_KEYS.shopLogoUrl].trim(),
        // Buang selain angka: admin sering mengetik "+62 858-…" atau spasi,
        // sedangkan tautan wa.me hanya menerima digit.
        whatsapp: all[SETTING_KEYS.shopWhatsapp].replace(/\D/g, ''),
        serviceHours: all[SETTING_KEYS.shopServiceHours].trim(),
        ctaBarText: all[SETTING_KEYS.shopCtaBarText].trim(),
        siteTitle: all[SETTING_KEYS.siteTitle].trim(),
        faviconUrl: all[SETTING_KEYS.faviconUrl].trim(),
      },
      rules: await this.getBusinessRules(),
      chat: {
        language: (CHAT_LANGUAGES as readonly string[]).includes(
          all[SETTING_KEYS.chatLanguage],
        )
          ? (all[SETTING_KEYS.chatLanguage] as ChatLanguage)
          : 'id',
      },
      theme: {
        // Hanya lolos bila hex 6 digit yang sah; selain itu dianggap kosong
        // supaya warna ngawur di DB tak sampai merusak tampilan.
        brandColor: /^#[0-9a-f]{6}$/i.test(
          all[SETTING_KEYS.themeBrandColor].trim(),
        )
          ? all[SETTING_KEYS.themeBrandColor].trim().toLowerCase()
          : '',
        secondaryColor: /^#[0-9a-f]{6}$/i.test(
          all[SETTING_KEYS.themeSecondaryColor].trim(),
        )
          ? all[SETTING_KEYS.themeSecondaryColor].trim().toLowerCase()
          : '',
      },
    };
  }
}
