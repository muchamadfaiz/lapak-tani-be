import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import otpConfig from '../../../config/otp.config';

/**
 * Pengirim pesan WhatsApp via Fonnte (https://fonnte.com).
 * Detail internal modul OTP. Token dari env FONNTE_TOKEN.
 */
@Injectable()
export class FonnteService {
  private readonly logger = new Logger(FonnteService.name);

  constructor(
    @Inject(otpConfig.KEY)
    private readonly cfg: ConfigType<typeof otpConfig>,
  ) {}

  async sendMessage(target: string, message: string): Promise<void> {
    if (!this.cfg.fonnteToken) {
      throw new Error('FONNTE_TOKEN belum diset');
    }
    const body = new URLSearchParams({ target, message });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000); // jgn menggantung
    let res: Response;
    try {
      res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: this.cfg.fonnteToken },
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
}
