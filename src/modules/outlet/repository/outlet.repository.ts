import { Injectable } from '@nestjs/common';
import { Outlet, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik data tabel `outlets`. Satu-satunya tempat yang boleh mengakses
 * `prisma.outlet`. Modul lain TIDAK boleh query tabel ini langsung —
 * gunakan OutletContract.
 */
@Injectable()
export class OutletRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OutletCreateInput): Promise<Outlet> {
    return this.prisma.outlet.create({ data });
  }

  findById(id: string): Promise<Outlet | null> {
    return this.prisma.outlet.findUnique({ where: { id } });
  }

  /** Jumlah outlet jualan (bukan gudang), boleh mengecualikan satu id. */
  countSellingOutlets(excludeId?: string): Promise<number> {
    return this.prisma.outlet.count({
      where: {
        isWarehouse: false,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  }

  async findWarehouseIds(): Promise<string[]> {
    const rows = await this.prisma.outlet.findMany({
      where: { isWarehouse: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /** Default: gudang DISEMBUNYIKAN (storefront). Admin kirim includeWarehouse. */
  findAll(includeWarehouse = false): Promise<Outlet[]> {
    return this.prisma.outlet.findMany({
      where: includeWarehouse ? undefined : { isWarehouse: false },
      orderBy: { name: 'asc' },
    });
  }

  update(id: string, data: Prisma.OutletUpdateInput): Promise<Outlet> {
    return this.prisma.outlet.update({ where: { id }, data });
  }

  delete(id: string): Promise<Outlet> {
    return this.prisma.outlet.delete({ where: { id } });
  }
}
