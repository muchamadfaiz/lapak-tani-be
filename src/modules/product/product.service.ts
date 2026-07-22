import { Injectable } from '@nestjs/common';
import { OutletContract } from '../outlet';
import {
  ProductRepository,
  ProductWithStocks,
} from './repository/product.repository';
import {
  ProductContract,
  ProductRef,
  ProductSearchResult,
} from './product.contract';

/**
 * Implementasi ProductContract — memenuhi janji lintas-modul. CRUD produk milik
 * modul ini sendiri (endpoint /products) tetap di use-case.
 */
@Injectable()
export class ProductService extends ProductContract {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly outletContract: OutletContract,
  ) {
    super();
  }

  async findById(id: string): Promise<ProductRef | null> {
    const product = await this.productRepository.findById(id);
    return product ? ProductService.toRef(product) : null;
  }

  async findByIds(ids: string[]): Promise<ProductRef[]> {
    const products = await this.productRepository.findByIds(ids);
    return products.map((p) => ProductService.toRef(p));
  }

  async search(keyword: string, limit = 8): Promise<ProductSearchResult[]> {
    const [products] = await this.productRepository.findAndCount(
      { search: keyword, available: true },
      { skip: 0, take: limit, orderBy: { name: 'asc' } },
    );
    // Gudang dikecualikan: stoknya belum bisa dijual, jadi jangan sampai bot
    // menjanjikan barang yang sebenarnya belum ada di rak outlet.
    const warehouseIds = await this.outletContract.findWarehouseIds();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      // Harga coret hanya sah bila di ATAS harga jual (lihat ProductMapper).
      originalPrice:
        p.originalPrice !== null && p.originalPrice > p.price
          ? p.originalPrice
          : null,
      unit: p.unit,
      tags: p.tags,
      isAvailable: p.isAvailable,
      stock: (p.outletStocks ?? [])
        .filter((s) => !warehouseIds.includes(s.outletId))
        .reduce((sum, s) => sum + s.stock, 0),
    }));
  }

  getStock(
    outletId: string,
    productIds: string[],
  ): Promise<Map<string, number>> {
    return this.productRepository.getStockForOutlet(outletId, productIds);
  }

  decrementStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    return this.productRepository.decrementStock(outletId, items);
  }

  restoreStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    return this.productRepository.restoreStock(outletId, items);
  }

  setStock(outletId: string, productId: string, qty: number): Promise<number> {
    return this.productRepository.setStock(outletId, productId, qty);
  }

  increaseStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    return this.productRepository.increaseStock(outletId, items);
  }

  private static toRef(product: ProductWithStocks): ProductRef {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable,
    };
  }
}
