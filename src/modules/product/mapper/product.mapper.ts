import { ProductResponseDto } from '../dto';
import { ProductWithStocks } from '../repository/product.repository';

export class ProductMapper {
  /**
   * Stok yang ditampilkan: outlet tertentu bila diberi, jika tidak TOTAL STOK
   * JUAL — yaitu jumlah stok seluruh outlet TANPA gudang. Stok gudang belum bisa
   * dijual (harus dikirim & diterima outlet dulu), jadi kalau ikut dijumlah,
   * produk bisa tampak "tersedia" padahal rak outlet kosong.
   */
  private static resolveStock(
    product: ProductWithStocks,
    outletId?: string,
    warehouseIds: string[] = [],
  ): number {
    const rows = product.outletStocks ?? [];
    if (outletId) {
      return rows.find((r) => r.outletId === outletId)?.stock ?? 0;
    }
    return rows
      .filter((r) => !warehouseIds.includes(r.outletId))
      .reduce((sum, r) => sum + r.stock, 0);
  }

  /** Response publik — TANPA costPrice (harga modal internal). */
  static toResponseDto(
    product: ProductWithStocks,
    outletId?: string,
    warehouseIds: string[] = [],
  ): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      stock: ProductMapper.resolveStock(product, outletId, warehouseIds),
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /** Response detail publik — sertakan rincian stok per outlet (TANPA costPrice). */
  static toDetailDto(
    product: ProductWithStocks,
    warehouseIds: string[] = [],
  ): ProductResponseDto {
    return {
      ...ProductMapper.toResponseDto(product, undefined, warehouseIds),
      outletStocks: (product.outletStocks ?? []).map((r) => ({
        outletId: r.outletId,
        stock: r.stock,
      })),
    };
  }

  /**
   * Response admin — termasuk costPrice + rincian stok per outlet.
   * `stock` tetap TOTAL STOK JUAL (tanpa gudang); stok gudang tetap terlihat
   * di `outletStocks` agar admin bisa memantaunya.
   */
  static toAdminResponseDto(
    product: ProductWithStocks,
    warehouseIds: string[] = [],
  ): ProductResponseDto {
    return {
      ...ProductMapper.toResponseDto(product, undefined, warehouseIds),
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
    warehouseIds: string[] = [],
  ): ProductResponseDto[] {
    return products.map((p) =>
      ProductMapper.toResponseDto(p, outletId, warehouseIds),
    );
  }
}
