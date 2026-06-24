import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DeleteFileUseCase {
  private readonly uploadDest: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDest = this.configService.get<string>(
      'storage.uploadDest',
      './uploads',
    );
  }

  async execute(id: string): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const filePath = path.join(
      this.uploadDest,
      ...file.url.replace('/uploads/', '').split('/'),
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.file.delete({ where: { id } });
  }
}
