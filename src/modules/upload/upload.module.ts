import { BadRequestException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { UploadController } from './upload.controller';
import { UploadFileUseCase, DeleteFileUseCase } from './use-cases';

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDest = configService.get<string>(
          'storage.uploadDest',
          './uploads',
        );
        const maxFileSize = configService.get<number>(
          'storage.maxFileSize',
          5 * 1024 * 1024,
        );

        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => {
              const dateDir = new Date().toISOString().split('T')[0];
              const dest = path.join(uploadDest, dateDir);
              fs.mkdirSync(dest, { recursive: true });
              cb(null, dest);
            },
            filename: (_req, file, cb) => {
              const ext = path.extname(file.originalname);
              cb(null, `${randomUUID()}${ext}`);
            },
          }),
          fileFilter: (_req, file, cb) => {
            if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
              return cb(
                new BadRequestException(
                  `File type not allowed. Allowed: ${ALLOWED_MIMETYPES.join(', ')}`,
                ),
                false,
              );
            }
            cb(null, true);
          },
          limits: { fileSize: maxFileSize },
        };
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadFileUseCase, DeleteFileUseCase],
})
export class UploadModule {}
