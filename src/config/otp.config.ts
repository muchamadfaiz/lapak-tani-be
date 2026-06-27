import { registerAs } from '@nestjs/config';

export default registerAs('otp', () => ({
  enabled: process.env.OTP_ENABLED === 'true',
  // Channel pengiriman OTP: 'whatsapp' (Fonnte) atau 'sms' (Twilio).
  channel: (process.env.OTP_CHANNEL || 'whatsapp') as 'whatsapp' | 'sms',
  fonnteToken: process.env.FONNTE_TOKEN || '',
  // Twilio (SMS)
  twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFrom: process.env.TWILIO_FROM || '',
  codeLength: Number(process.env.OTP_CODE_LENGTH || 6),
  ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  resendCooldownSec: Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60),
}));
