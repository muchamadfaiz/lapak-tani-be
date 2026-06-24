import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  enabled: process.env.EMAIL_ENABLED === 'true',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || 'noreply@app.com',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
