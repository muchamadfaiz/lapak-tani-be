import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { normalizePhone } from '../../../common';
import otpConfig from '../../../config/otp.config';

/**
 * Pengirim SMS via Twilio (REST API, tanpa SDK). Detail internal modul OTP.
 * Kredensial dari env TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM.
 */
@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  constructor(
    @Inject(otpConfig.KEY)
    private readonly cfg: ConfigType<typeof otpConfig>,
  ) {}

  async sendMessage(phone: string, message: string): Promise<void> {
    const { twilioSid, twilioToken, twilioFrom } = this.cfg;
    if (!twilioSid || !twilioToken || !twilioFrom) {
      throw new Error('Twilio belum dikonfigurasi (SID/TOKEN/FROM)');
    }
    const to = '+' + normalizePhone(phone); // Twilio butuh format E.164 (+62...)
    const body = new URLSearchParams({ To: to, From: twilioFrom, Body: message });
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timer);
    }
    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      status?: string;
    };
    this.logger.debug(`Twilio resp ${res.status}: ${JSON.stringify(json)}`);
    if (!res.ok) {
      this.logger.warn(`Twilio gagal: ${res.status} ${json.message ?? ''}`);
      throw new Error(json.message || 'Gagal mengirim SMS');
    }
  }
}
