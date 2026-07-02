import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomInt } from 'crypto';
import { normalizePhone } from '../../../common';
import waLoginConfig from '../../../config/wa-login.config';
import { OtpContract } from '../otp.contract';
import { WaLoginRepository } from './wa-login.repository';

// Karakter kode (tanpa yang ambigu: O/0, I/1) + prefix biar gampang diekstrak.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PREFIX = 'LT';

export interface WaLoginStart {
  code: string;
  waNumber: string;
  waUrl: string;
  expiresInSec: number;
}

export interface WaLoginStatus {
  status: 'pending' | 'verified' | 'expired';
  phone?: string;
  token?: string;
}

@Injectable()
export class WaLoginService {
  private readonly logger = new Logger(WaLoginService.name);

  constructor(
    @Inject(waLoginConfig.KEY)
    private readonly cfg: ConfigType<typeof waLoginConfig>,
    private readonly repo: WaLoginRepository,
    private readonly otp: OtpContract,
  ) {}

  /** 1) App minta sesi login → dapat kode + link wa.me siap dibuka. */
  async start(): Promise<WaLoginStart> {
    const businessNumber = normalizePhone(this.cfg.businessNumber || '');
    if (!businessNumber) {
      throw new BadRequestException('Login WhatsApp belum dikonfigurasi');
    }
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.cfg.ttlSec * 1000);
    await this.repo.create({ code, expiresAt });

    const text =
      `Halo Lapak Tani! Saya mau masuk/daftar aplikasi dengan nomor WhatsApp ini.\n` +
      `Kode saya: ${code}\n\n` +
      `(Jangan ubah kode ini & jangan bagikan ke siapa pun.)`;
    const waUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
    return { code, waNumber: businessNumber, waUrl, expiresInSec: this.cfg.ttlSec };
  }

  /**
   * 2) Webhook pesan masuk (dipanggil Fonnte). Ambil kode dari pesan, cocokkan
   * ke sesi pending, lalu isi `phone` dari nomor pengirim (terbukti miliknya
   * karena pesan datang dari WhatsApp-nya).
   */
  async handleIncoming(
    sender: string,
    message: string,
  ): Promise<{ ok: boolean; matched: boolean }> {
    const code = this.extractCode(message || '');
    const phone = normalizePhone(sender || '');
    if (!code || phone.length < 8) {
      this.logger.debug(`WA masuk tak cocok: sender=${sender} msg=${message}`);
      return { ok: true, matched: false };
    }
    const sess = await this.repo.findPendingByCode(code);
    if (!sess) {
      this.logger.debug(`Kode ${code} tak ada sesi pending`);
      return { ok: true, matched: false };
    }
    await this.repo.markVerified(sess.id, phone);
    this.logger.log(`WA login verified: ${phone} (code ${code})`);
    return { ok: true, matched: true };
  }

  /** 3) App polling status by code. Bila verified → kembalikan token sesi-HP. */
  async status(code: string): Promise<WaLoginStatus> {
    const sess = code ? await this.repo.findByCode(code) : null;
    if (!sess) return { status: 'expired' };
    if (sess.status === 'verified' && sess.phone) {
      return {
        status: 'verified',
        phone: sess.phone,
        token: this.otp.issuePhoneToken(sess.phone),
      };
    }
    if (sess.expiresAt.getTime() < Date.now()) return { status: 'expired' };
    return { status: 'pending' };
  }

  private generateCode(): string {
    let s = CODE_PREFIX;
    for (let i = 0; i < this.cfg.codeLength; i++) {
      s += CODE_CHARS[randomInt(CODE_CHARS.length)];
    }
    return s;
  }

  /** Ekstrak kode `LTxxxxxx` dari teks pesan (toleran ada kata lain). */
  private extractCode(message: string): string | null {
    const m = message.toUpperCase().match(/LT[A-Z0-9]{4,12}/);
    return m ? m[0] : null;
  }
}
