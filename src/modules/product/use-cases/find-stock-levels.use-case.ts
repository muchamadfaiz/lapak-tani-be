import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../repository/product.repository';

export interface StockLevelRow {
  productId: string;
  productName: string;
  categoryId: string | null;
  imageUrl: string | null;
  /** Stok per outlet/gudang: outletId → stock. Outlet tanpa baris = 0 (dihilangkan). */
  stocks: { outletId: string; stock: number }[];
}

/**
 * Matriks stok produk × outlet untuk halaman "Sisa Stok" admin. Read-only —
 * angka stok hanya berubah lewat pengadaan/kiriman/penjualan/koreksi (buku besar).
 */
@Injectable()
export class FindStockLevelsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(): Promise<StockLevelRow[]> {
    const products = await this.productRepository.findAllWithStocks();
    return products.map((p) => ({
      productId: p.id,
      productName: p.name,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl,
      stocks: p.outletStocks.map((s) => ({
        outletId: s.outletId,
        stock: s.stock,
      })),
    }));
  }
}
