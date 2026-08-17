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

  /**
   * Kapan terakhir salah satu key ini disimpan. Dipakai dashboard sebagai
   * bukti bahwa kredensial memang tersimpan — kolom isiannya sendiri selalu
   * kosong karena nilai rahasia tak pernah dikirim balik ke browser.
   * null = belum pernah disimpan lewat dashboard (masih memakai env).
   */
  async findLastUpdatedAt(keys: string[]): Promise<Date | null> {
    const row = await this.prisma.setting.findFirst({
      where: { key: { in: keys } },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return row?.updatedAt ?? null;
  }

  async upsert(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
