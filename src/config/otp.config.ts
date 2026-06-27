import { registerAs } from '@nestjs/config';

export default registerAs('otp', () => ({
  enabled: process.env.OTP_ENABLED === 'true',
  fonnteToken: process.env.FONNTE_TOKEN || '',
  codeLength: Number(process.env.OTP_CODE_LENGTH || 6),
  ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  resendCooldownSec: Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60),
}));
