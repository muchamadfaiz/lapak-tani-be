import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { StorageContract } from './storage.contract';

/**
 * Implementasi StorageContract di atas disk lokal (folder ./uploads).
 * Satu-satunya tempat yang boleh menyentuh `fs` & path filesystem.
 * Untuk MinIO/S3 nanti: buat `MinioStorage extends StorageContract`,
 * lalu ubah `useClass` di FileModule — use-case tidak berubah.
 */
@Injectable()
export class LocalDiskStorage extends StorageContract {
  private readonly uploadDest: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.uploadDest = this.configService.get<string>(
      'storage.uploadDest',
      './uploads',
    );
  }

  buildUrl(filename: string, dateDir: string): string {
    return `/uploads/${dateDir}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const filePath = path.join(
      this.uploadDest,
      ...url.replace('/uploads/', '').split('/'),
    );
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
