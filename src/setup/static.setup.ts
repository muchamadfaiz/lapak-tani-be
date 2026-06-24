import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

export function setupStaticAssets(app: INestApplication) {
  const configService = app.get(ConfigService);
  const uploadDest = configService.get<string>(
    'storage.uploadDest',
    './uploads',
  );

  (app as NestExpressApplication).useStaticAssets(
    path.resolve(uploadDest),
    { prefix: '/uploads' },
  );
}
