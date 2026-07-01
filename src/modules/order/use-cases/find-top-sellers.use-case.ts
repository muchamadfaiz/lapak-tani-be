import { Injectable } from '@nestjs/common';
import { ProductContract } from '../../product';
import { OrderRepository } from '../repository/order.repository';
import { TopSellerResponseDto } from '../dto';

const DEFAULT_LIMIT = 10;

/**
 * Produk terlaris: ranking dari agregasi order_items (OrderRepository, hanya
 * order completed) lalu dirakit dengan data produk via ProductContract —
 * order_items tetap milik Order, produk diambil lewat kontrak (bukan query
 * langsung ke tabel products).
 */
@Injectable()
export class FindTopSellersUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productContract: ProductContract,
  ) {}

  async execute(limit = DEFAULT_LIMIT): Promise<TopSellerResponseDto[]> {
    const ranked = await this.orderRepository.topSellingProductIds(limit);
    if (ranked.length === 0) {
      return [];
    }

    const products = await this.productContract.findByIds(
      ranked.map((r) => r.productId),
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    // Pertahankan urutan ranking; produk yang sudah terhapus (tak ada di
    // findByIds) di-skip.
    return ranked
      .map((r) => {
        const p = byId.get(r.productId);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          outletId: p.outletId,
          stock: p.stock,
          isAvailable: p.isAvailable,
          soldCount: r.soldCount,
        };
      })
      .filter((x): x is TopSellerResponseDto => x !== null);
  }
}
