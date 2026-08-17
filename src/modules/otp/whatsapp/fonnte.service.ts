import { Injectable, Logger } from '@nestjs/common';
import { SettingContract } from '../../setting';

const FONNTE_API = 'https://api.fonnte.com';

/** Hasil pemeriksaan token + perangkat, untuk tombol "Tes Koneksi" di dashboard. */
export interface FonnteDeviceStatus {
  ok: boolean;
  /** true bila perangkat WhatsApp benar-benar tersambung ke Fonnte. */
  connected: boolean;
  /** Sisa kuota pesan bila dilaporkan Fonnte. */
  quota: string | null;
  message: string;
}

/**
 * Pengirim pesan WhatsApp via Fonnte (https://fonnte.com).
 * Detail internal modul OTP.
 *
 * Token dibaca dari pengaturan SETIAP kali dipakai (bukan sekali saat booting),
 * supaya token baru yang disimpan admin langsung berlaku tanpa restart —
 * penting karena token Fonnte berganti setiap perangkat WA-nya diganti.
 */
@Injectable()
export class FonnteService {
  private readonly logger = new Logger(FonnteService.name);

  constructor(private readonly settings: SettingContract) {}

  async sendMessage(target: string, message: string): Promise<void> {
    const { fonnteToken } = await this.settings.getOtpCredentials();
    if (!fonnteToken) {
      throw new Error('Token Fonnte belum diisi');
    }
    const body = new URLSearchParams({ target, message });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000); // jgn menggantung
    let res: Response;
    try {
      res = await fetch(`${FONNTE_API}/send`, {
        method: 'POST',
        headers: { Authorization: fonnteToken },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const json = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      reason?: string;
    };
    this.logger.debug(`Fonnte resp ${res.status}: ${JSON.stringify(json)}`);
    if (!res.ok || json.status === false) {
      this.logger.warn(`Fonnte gagal: ${res.status} ${json.reason ?? ''}`);
      throw new Error(json.reason || 'Gagal mengirim WhatsApp');
    }
  }

  /**
   * Periksa token DAN status perangkat lewat endpoint `/device`.
   *
   * Pemeriksaan token saja tidak cukup untuk Fonnte: token bisa sah sementara
   * perangkat WhatsApp-nya sudah lepas dari sesi, dan pengiriman gagal tanpa
   * gejala yang jelas. Karena itu status sambungan dan sisa kuota ikut
   * dilaporkan — admin bisa memeriksa sendiri sebelum pelanggan mengeluh
   * tidak menerima kode.
   *
   * `tokenOverride` dipakai agar token yang baru diketik bisa diuji SEBELUM
   * disimpan.
   */
  async checkDevice(tokenOverride?: string): Promise<FonnteDeviceStatus> {
    const token =
      tokenOverride?.trim() ||
      (await this.settings.getOtpCredentials()).fonnteToken;
    if (!token) {
      return {
        ok: false,
        connected: false,
        quota: null,
        message: 'Token Fonnte belum diisi',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`${FONNTE_API}/device`, {
        method: 'POST',
        headers: { Authorization: token },
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => ({}))) as {
        status?: boolean;
        reason?: string;
        device_status?: string;
        quota?: string | number;
        messages?: string | number;
      };
      this.logger.debug(`Fonnte /device ${res.status}: ${JSON.stringify(json)}`);

      if (!res.ok || json.status === false) {
        return {
          ok: false,
          connected: false,
          quota: null,
          message:
            json.reason === 'token invalid' || res.status === 401
              ? 'Token ditolak Fonnte. Salin ulang dari dashboard Fonnte → Device → Token.'
              : `Fonnte menolak permintaan${json.reason ? ': ' + json.reason : ` (kode ${res.status})`}`,
        };
      }

      const status = String(json.device_status ?? '').toLowerCase();
      const connected = status === 'connect' || status === 'connected';
      const quota =
        json.quota != null
          ? String(json.quota)
          : json.messages != null
            ? String(json.messages)
            : null;

      return {
        ok: connected,
        connected,
        quota,
        message: connected
          ? `Token valid dan perangkat WhatsApp tersambung.${quota ? ` Sisa kuota: ${quota}.` : ''}`
          : 'Token valid, tetapi perangkat WhatsApp TIDAK tersambung. Buka dashboard Fonnte lalu pindai ulang QR — selama terputus, kode OTP tidak akan terkirim.',
      };
    } catch (e) {
      const err = e as Error;
      this.logger.warn(`Fonnte /device gagal: ${err.message}`);
      return {
        ok: false,
        connected: false,
        quota: null,
        message:
          err.name === 'AbortError'
            ? 'Fonnte tidak menjawab dalam 15 detik. Periksa koneksi internet server, lalu coba lagi.'
            : 'Tidak bisa menghubungi Fonnte. Periksa koneksi internet server, lalu coba lagi.',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
