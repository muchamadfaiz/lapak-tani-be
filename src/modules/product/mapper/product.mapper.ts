import { ProductResponseDto } from '../dto';
import { ProductWithStocks } from '../repository/product.repository';

export class ProductMapper {
  /** Stok yang ditampilkan: outlet tertentu bila diberi, jika tidak total. */
  private static resolveStock(
    product: ProductWithStocks,
    outletId?: string,
  ): number {
    const rows = product.outletStocks ?? [];
    if (outletId) {
      return rows.find((r) => r.outletId === outletId)?.stock ?? 0;
    }
    return rows.reduce((sum, r) => sum + r.stock, 0);
  }

  /** Response publik — TANPA costPrice (harga modal internal). */
  static toResponseDto(
    product: ProductWithStocks,
    outletId?: string,
  ): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      stock: ProductMapper.resolveStock(product, outletId),
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /** Response detail publik — sertakan rincian stok per outlet (TANPA costPrice). */
  static toDetailDto(product: ProductWithStocks): ProductResponseDto {
    return {
      ...ProductMapper.toResponseDto(product),
      outletStocks: (product.outletStocks ?? []).map((r) => ({
        outletId: r.outletId,
        stock: r.stock,
      })),
    };
  }

  /** Response admin — termasuk costPrice + rincian stok per outlet. */
  static toAdminResponseDto(product: ProductWithStocks): ProductResponseDto {
    return {
      ...ProductMapper.toResponseDto(product),
      costPrice: product.costPrice,
      outletStocks: (product.outletStocks ?? []).map((r) => ({
        outletId: r.outletId,
        stock: r.stock,
      })),
    };
  }

  static toResponseDtoList(
    products: ProductWithStocks[],
    outletId?: string,
  ): ProductResponseDto[] {
    return products.map((p) => ProductMapper.toResponseDto(p, outletId));
  }
}
