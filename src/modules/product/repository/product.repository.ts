import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ProductFilter {
  categoryId?: string;
  search?: string;
  available?: boolean;
  featured?: boolean;
}

const WITH_STOCKS = { outletStocks: true } as const;

// Produk beserta baris stok per outlet.
export type ProductWithStocks = Prisma.ProductGetPayload<{
  include: typeof WITH_STOCKS;
}>;

/**
 * Pemilik data tabel `products` DAN `product_outlets`. Satu-satunya tempat yang
 * boleh mengakses `prisma.product`/`prisma.productOutlet`. Modul lain TIDAK boleh
 * query tabel ini langsung — gunakan ProductContract.
 *
 * Model: satu produk (harga global) dijual di semua outlet; yang beda hanya stok
 * per outlet (tabel product_outlets).
 */
@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProductCreateInput): Promise<ProductWithStocks> {
    return this.prisma.product.create({ data, include: WITH_STOCKS });
  }

  /** Set/timpa stok produk di beberapa outlet (upsert per (produk, outlet)). */
  async setStocks(
    productId: string,
    stocks: { outletId: string; stock: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      stocks.map((s) =>
        this.prisma.productOutlet.upsert({
          where: { productId_outletId: { productId, outletId: s.outletId } },
          update: { stock: s.stock },
          create: { productId, outletId: s.outletId, stock: s.stock },
        }),
      ),
    );
  }

  // Hanya produk aktif (deletedAt: null) yang tampil di semua query.
  findById(id: string): Promise<ProductWithStocks | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: WITH_STOCKS,
    });
  }

  findByIds(ids: string[]): Promise<ProductWithStocks[]> {
    return this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: WITH_STOCKS,
    });
  }

  /** Stok beberapa produk pada satu outlet → productId → stock. */
  async getStockForOutlet(
    outletId: string,
    productIds: string[],
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.productOutlet.findMany({
      where: { outletId, productId: { in: productIds } },
      select: { productId: true, stock: true },
    });
    return new Map(rows.map((r) => [r.productId, r.stock]));
  }

  private buildWhere(filter: ProductFilter): Prisma.ProductWhereInput {
    return {
      deletedAt: null,
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.available !== undefined && { isAvailable: filter.available }),
      ...(filter.featured !== undefined && { isFeatured: filter.featured }),
      ...(filter.search && {
        name: { contains: filter.search, mode: 'insensitive' },
      }),
    };
  }

  /** Daftar produk terpaginasi + total (untuk meta). */
  findAndCount(
    filter: ProductFilter,
    opts: {
      skip: number;
      take: number;
      orderBy: Prisma.ProductOrderByWithRelationInput;
    },
  ): Promise<[ProductWithStocks[], number]> {
    const where = this.buildWhere(filter);
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: opts.orderBy,
        skip: opts.skip,
        take: opts.take,
        include: WITH_STOCKS,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithStocks> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: WITH_STOCKS,
    });
  }

  /** Soft delete: tandai terhapus & nonaktifkan agar tak bisa dipesan. */
  delete(id: string): Promise<ProductWithStocks> {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
      include: WITH_STOCKS,
    });
  }

  /**
   * Kurangi stok beberapa produk pada SATU outlet dalam satu transaksi.
   * updateMany dengan guard `stock >= quantity` memastikan tak ada stok minus
   * (anti oversell); bila ada yang gagal (count 0), seluruh transaksi rollback.
   */
  async decrementStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    // Urutkan by productId agar lock order konsisten antar-transaksi (anti-deadlock).
    const ordered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    await this.prisma.$transaction(async (tx) => {
      for (const it of ordered) {
        const res = await tx.productOutlet.updateMany({
          where: {
            productId: it.productId,
            outletId,
            stock: { gte: it.quantity },
          },
          data: { stock: { decrement: it.quantity } },
        });
        if (res.count === 0) {
          throw new BadRequestException(
            'Stok produk tidak mencukupi di outlet ini',
          );
        }
      }
    });
  }

  /**
   * Tambah stok pada satu outlet (barang masuk). Upsert: baris (produk, outlet)
   * dibuat bila belum ada — penting untuk gudang/outlet yang belum punya stok.
   */
  async increaseStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    const ordered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    await this.prisma.$transaction(
      ordered.map((it) =>
        this.prisma.productOutlet.upsert({
          where: { productId_outletId: { productId: it.productId, outletId } },
          update: { stock: { increment: it.quantity } },
          create: { productId: it.productId, outletId, stock: it.quantity },
        }),
      ),
    );
  }

  /** Kembalikan stok pada satu outlet (increment). */
  async restoreStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    const ordered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    await this.prisma.$transaction(
      ordered.map((it) =>
        this.prisma.productOutlet.updateMany({
          where: { productId: it.productId, outletId },
          data: { stock: { increment: it.quantity } },
        }),
      ),
    );
  }
}
