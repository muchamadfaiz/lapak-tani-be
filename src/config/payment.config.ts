import { registerAs } from '@nestjs/config';

export default registerAs('midtrans', () => ({
  enabled: process.env.MIDTRANS_ENABLED === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
}));
