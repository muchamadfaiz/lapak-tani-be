import { Injectable } from '@nestjs/common';
import { File } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik data tabel `files`. Satu-satunya tempat di seluruh aplikasi
 * yang boleh mengakses `prisma.file`. Modul lain TIDAK boleh query tabel ini
 * langsung — gunakan FileContract.
 */
@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: string;
    originalName: string;
    filename: string;
    url: string;
    mimetype: string;
    size: number;
  }): Promise<File> {
    return this.prisma.file.create({ data });
  }

  findById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({ where: { id } });
  }

  deleteById(id: string): Promise<File> {
    return this.prisma.file.delete({ where: { id } });
  }
}
