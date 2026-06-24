import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common';
import { ResponseInterceptor } from './common';
import { setupStaticAssets } from './setup/static.setup';
import { setupSwagger } from './setup/swagger.setup';
import appConfig from './config/app.config';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger
  app.useLogger(app.get(Logger));

  // Trust reverse proxy (Caddy/Vercel) agar IP asli klien terbaca dari
  // X-Forwarded-For — penting supaya rate-limit (throttler) per-IP akurat.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security headers. CSP dimatikan (API mengembalikan JSON & Swagger UI butuh
  // inline script/style); crossOriginResourcePolicy dilonggarkan agar frontend
  // beda origin tetap bisa memuat gambar dari /uploads.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Config
  const configService = app.get(ConfigService);
  const appCfg = configService.get<ReturnType<typeof appConfig>>('app');

  // CORS
  app.enableCors({
    origin:
      appCfg.nodeEnv === 'development' ? '*' : appCfg.corsOrigins,
    credentials: true,
  });

  // Global route prefix (all routes served under /api/...)
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(appCfg));

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  // Static assets (uploads)
  setupStaticAssets(app);

  // Swagger
  setupSwagger(app);

  await app.listen(appCfg.port);

  const logger = app.get(Logger);
  logger.log(`Application running on http://localhost:${appCfg.port}`);
  if (appCfg.nodeEnv !== 'production') {
    logger.log(`Swagger docs on http://localhost:${appCfg.port}/api/docs`);
  }
}
bootstrap();
