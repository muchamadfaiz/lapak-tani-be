import { Injectable } from '@nestjs/common';
import { SettingRepository } from './repository/setting.repository';
import {
  PublicPaymentSettings,
  PublicSettings,
  SETTING_KEYS,
  SettingContract,
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
  // Kosong = frontend memakai palet bawaannya.
  [SETTING_KEYS.themeBrandColor]: '',
};

@Injectable()
export class SettingService extends SettingContract {
  constructor(private readonly repo: SettingRepository) {
    super();
  }

  /** Semua pengaturan (admin) — default diisi bila belum ada di DB. */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.repo.findAll();
    const map = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  }

  /** Simpan sebagian pengaturan. Hanya key yang dikenal yang diterima. */
  async update(patch: Record<string, string>): Promise<Record<string, string>> {
    const known = new Set<string>(Object.values(SETTING_KEYS));
    for (const [key, value] of Object.entries(patch)) {
      if (!known.has(key)) continue; // abaikan key asing (anti-sampah)
      await this.repo.upsert(key, String(value));
    }
    return this.getAll();
  }

  async isOnlinePaymentEnabled(): Promise<boolean> {
    const map = await this.repo.findMany([SETTING_KEYS.onlinePaymentEnabled]);
    const raw = map.get(SETTING_KEYS.onlinePaymentEnabled);
    // Belum pernah diset → default aktif (perilaku lama tak berubah).
    return raw === undefined ? true : raw === 'true';
  }

  async getPublicPaymentSettings(): Promise<PublicPaymentSettings> {
    const all = await this.getAll();
    return {
      onlinePaymentEnabled: all[SETTING_KEYS.onlinePaymentEnabled] === 'true',
      bankName: all[SETTING_KEYS.bankName],
      bankAccountNumber: all[SETTING_KEYS.bankAccountNumber],
      bankAccountName: all[SETTING_KEYS.bankAccountName],
    };
  }

  /** Pembayaran + bilah promo, untuk storefront & halaman pengaturan admin. */
  async getPublicSettings(): Promise<PublicSettings> {
    const all = await this.getAll();
    const title = all[SETTING_KEYS.promoBarTitle].trim();
    return {
      ...(await this.getPublicPaymentSettings()),
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
      },
      theme: {
        // Hanya lolos bila hex 6 digit yang sah; selain itu dianggap kosong
        // supaya warna ngawur di DB tak sampai merusak tampilan.
        brandColor: /^#[0-9a-f]{6}$/i.test(
          all[SETTING_KEYS.themeBrandColor].trim(),
        )
          ? all[SETTING_KEYS.themeBrandColor].trim().toLowerCase()
          : '',
      },
    };
  }
}
