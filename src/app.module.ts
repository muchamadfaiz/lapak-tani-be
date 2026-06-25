import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  storageConfig,
  emailConfig,
  validate,
} from './config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma';
import { EmailModule } from './modules/email';
import { AuthModule, JwtAuthGuard } from './modules/auth';
import { UserModule } from './modules/user/user.module';
import { FileModule } from './modules/file';
import { CategoryModule } from './modules/category';
import { OutletModule } from './modules/outlet';

import { RolesGuard } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, emailConfig],
      validate,
    }),
    // Rate limiting global: default 120 request / menit per IP (anti spam & DoS).
    // Bisa di-override via env (THROTTLE_TTL/THROTTLE_LIMIT) — berguna saat load test:
    // set THROTTLE_LIMIT besar untuk sementara, lalu kembalikan.
    // Endpoint sensitif (login, survei publik) dibatasi lebih ketat via @Throttle.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          name: 'default',
          ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
          limit: Number(process.env.THROTTLE_LIMIT ?? 120),
        },
      ],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('app.nodeEnv');
        const isDev = nodeEnv === 'development';

        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          },
        };
      },
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UserModule,
    FileModule,
    CategoryModule,
    OutletModule,
  ],
  providers: [
    // ThrottlerGuard didaftarkan pertama agar rate-limit jalan sebelum auth
    // (mis. brute-force login yang @Public tetap kena batas).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
