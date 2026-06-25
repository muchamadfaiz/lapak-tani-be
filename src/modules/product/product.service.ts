import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductRepository } from './repository/product.repository';
import { ProductContract, ProductRef } from './product.contract';

/**
 * Implementasi ProductContract — memenuhi janji lintas-modul. CRUD produk milik
 * modul ini sendiri (endpoint /products) tetap di use-case.
 */
@Injectable()
export class ProductService extends ProductContract {
  constructor(private readonly productRepository: ProductRepository) {
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

  decrementStock(items: { productId: string; quantity: number }[]): Promise<void> {
    return this.productRepository.decrementStock(items);
  }

  restoreStock(items: { productId: string; quantity: number }[]): Promise<void> {
    return this.productRepository.restoreStock(items);
  }

  private static toRef(product: Product): ProductRef {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      outletId: product.outletId,
      stock: product.stock,
      isAvailable: product.isAvailable,
    };
  }
}
