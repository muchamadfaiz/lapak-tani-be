import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { normalizePhone } from '../../common';
import otpConfig from '../../config/otp.config';
import jwtConfig from '../../config/jwt.config';
import { OtpRepository } from './repository/otp.repository';
import { FonnteService } from './whatsapp/fonnte.service';
import { TwilioService } from './sms/twilio.service';
import { OtpContract, RequestOtpResult } from './otp.contract';

const PHONE_TOKEN_TTL = '30d';

@Injectable()
export class OtpService extends OtpContract {
  private readonly logger = new Logger(OtpService.name);
  private readonly isProd = process.env.NODE_ENV === 'production';

  constructor(
    @Inject(otpConfig.KEY)
    private readonly cfg: ConfigType<typeof otpConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    private readonly jwt: JwtService,
    private readonly repo: OtpRepository,
    private readonly fonnte: FonnteService,
    private readonly twilio: TwilioService,
  ) {
    super();
  }

  get enabled(): boolean {
    return this.cfg.enabled;
  }

  async requestOtp(rawPhone: string, purpose = 'verify'): Promise<RequestOtpResult> {
    const phone = normalizePhone(rawPhone || '');
    if (phone.length < 10) {
      throw new BadRequestException('Nomor HP tidak valid');
    }

    // Cooldown kirim ulang.
    const recent = await this.repo.findMostRecent(phone, purpose);
    if (recent) {
      const elapsed = (Date.now() - recent.createdAt.getTime()) / 1000;
      if (elapsed < this.cfg.resendCooldownSec) {
        throw new BadRequestException(
          `Tunggu ${Math.ceil(this.cfg.resendCooldownSec - elapsed)} detik sebelum minta kode lagi`,
        );
      }
    }

    // Generate kode numerik & simpan hash-nya.
    const code = this.generateCode(this.cfg.codeLength);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.cfg.ttlMinutes * 60 * 1000);
    await this.repo.create({ phone, codeHash, purpose, expiresAt });

    // Visibilitas dev (debug level → tak tampil di prod yang pakai level info).
    this.logger.debug(`OTP ${purpose} untuk ${phone}: ${code}`);

    // Kirim via channel terpilih bila aktif.
    // - whatsapp → Fonnte, sms → Twilio (keduanya benar-benar kirim ke pemilik nomor)
    // - screen   → TIDAK kirim; kode dikembalikan di response (DEMO, tak aman)
    let sent = false;
    if (this.cfg.enabled && this.cfg.channel !== 'screen') {
      const msg = `Kode OTP Lapak Tani kamu: ${code}. Berlaku ${this.cfg.ttlMinutes} menit. Jangan beri tahu siapa pun.`;
      if (this.cfg.channel === 'sms') {
        await this.twilio.sendMessage(phone, msg);
      } else {
        await this.fonnte.sendMessage(phone, msg);
      }
      sent = true;
    }

    // Kode dikembalikan di response saat: non-production (dev), ATAU channel=screen.
    const exposeCode = !this.isProd || this.cfg.channel === 'screen';
    return {
      sent,
      expiresInSec: this.cfg.ttlMinutes * 60,
      ...(exposeCode ? { devCode: code } : {}),
    };
  }

  async verifyOtp(rawPhone: string, code: string, purpose = 'verify'): Promise<boolean> {
    const phone = normalizePhone(rawPhone || '');
    const otp = await this.repo.findActive(phone, purpose);
    if (!otp) {
      throw new BadRequestException('Kode OTP tidak ditemukan atau sudah kadaluarsa');
    }
    if (otp.attempts >= this.cfg.maxAttempts) {
      throw new BadRequestException('Terlalu banyak percobaan. Minta kode baru.');
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      await this.repo.incrementAttempts(otp.id);
      throw new BadRequestException('Kode OTP salah');
    }

    await this.repo.consume(otp.id);
    return true;
  }

  issuePhoneToken(phone: string): string {
    return this.jwt.sign(
      { phone: normalizePhone(phone), typ: 'phone' },
      { secret: this.jwtCfg.accessSecret, expiresIn: PHONE_TOKEN_TTL },
    );
  }

  verifyPhoneToken(token: string): { phone: string } | null {
    try {
      const p = this.jwt.verify<{ phone: string; typ: string }>(token, {
        secret: this.jwtCfg.accessSecret,
      });
      if (p.typ !== 'phone' || !p.phone) return null;
      return { phone: p.phone };
    } catch {
      return null;
    }
  }

  private generateCode(length: number): string {
    let s = '';
    for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
    return s;
  }
}
