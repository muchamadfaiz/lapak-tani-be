import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');

  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled');

  if (nodeEnv === 'production' && !swaggerEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Lapak Tani API')
    .setDescription(
      'API Lapak Tani — marketplace produk pertanian. Mencakup autentikasi JWT ' +
        '(access + refresh token), RBAC, manajemen pengguna, dan upload file.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
