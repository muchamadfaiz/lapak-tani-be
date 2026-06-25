import { Product } from '@prisma/client';
import { ProductResponseDto } from '../dto';

export class ProductMapper {
  /** Response publik — TANPA costPrice (harga modal internal). */
  static toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      outletId: product.outletId,
      stock: product.stock,
      isAvailable: product.isAvailable,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /** Response admin — termasuk costPrice. */
  static toAdminResponseDto(product: Product): ProductResponseDto {
    return { ...ProductMapper.toResponseDto(product), costPrice: product.costPrice };
  }

  static toResponseDtoList(products: Product[]): ProductResponseDto[] {
    return products.map((p) => ProductMapper.toResponseDto(p));
  }
}
