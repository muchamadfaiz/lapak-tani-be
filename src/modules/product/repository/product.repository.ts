import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ProductFilter {
  outletId?: string;
  categoryId?: string;
  search?: string;
  available?: boolean;
}

/**
 * Pemilik data tabel `products`. Satu-satunya tempat yang boleh mengakses
 * `prisma.product`. Modul lain TIDAK boleh query tabel ini langsung —
 * gunakan ProductContract.
 */
@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findByIds(ids: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { id: { in: ids } } });
  }

  findAll(filter: ProductFilter): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {
      ...(filter.outletId && { outletId: filter.outletId }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.available !== undefined && { isAvailable: filter.available }),
      ...(filter.search && {
        name: { contains: filter.search, mode: 'insensitive' },
      }),
    };
    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }

  delete(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }

  /**
   * Kurangi stok beberapa produk dalam satu transaksi. updateMany dengan
   * guard `stock >= quantity` memastikan tak ada stok minus (anti oversell);
   * bila ada yang gagal (count 0), seluruh transaksi di-rollback.
   */
  async decrementStock(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    // Urutkan by productId agar lock order konsisten antar-transaksi (anti-deadlock).
    const ordered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    await this.prisma.$transaction(async (tx) => {
      for (const it of ordered) {
        const res = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (res.count === 0) {
          throw new BadRequestException('Stok produk tidak mencukupi');
        }
      }
    });
  }

  /** Kembalikan stok (increment). updateMany → tak error walau produk sudah dihapus. */
  async restoreStock(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    const ordered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    await this.prisma.$transaction(
      ordered.map((it) =>
        this.prisma.product.updateMany({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        }),
      ),
    );
  }
}
