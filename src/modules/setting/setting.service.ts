import { Injectable } from '@nestjs/common';
import { SettingRepository } from './repository/setting.repository';
import {
  PublicPaymentSettings,
  SETTING_KEYS,
  SettingContract,
} from './setting.contract';

/** Nilai bawaan bila admin belum pernah menyimpan pengaturan. */
const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.onlinePaymentEnabled]: 'true',
  [SETTING_KEYS.bankName]: '',
  [SETTING_KEYS.bankAccountNumber]: '',
  [SETTING_KEYS.bankAccountName]: '',
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
}
