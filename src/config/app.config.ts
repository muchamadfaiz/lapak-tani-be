import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  corsOrigins: process.env.APP_CORS_ORIGINS?.split(',') || ['*'],
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
}));
