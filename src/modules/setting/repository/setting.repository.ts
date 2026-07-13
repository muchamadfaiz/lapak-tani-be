import { Injectable } from '@nestjs/common';
import { Setting } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Pemilik tunggal tabel `settings` (key-value). */
@Injectable()
export class SettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Setting[]> {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async findMany(keys: string[]): Promise<Map<string, string>> {
    const rows = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });
    return new Map(rows.map((r) => [r.key, r.value]));
  }

  async upsert(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
