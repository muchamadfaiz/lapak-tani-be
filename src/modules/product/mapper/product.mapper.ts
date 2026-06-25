import { Product } from '@prisma/client';
import { ProductResponseDto } from '../dto';

export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
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

  static toResponseDtoList(products: Product[]): ProductResponseDto[] {
    return products.map((p) => ProductMapper.toResponseDto(p));
  }
}
