import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../repository/product.repository';
import { FindProductsQueryDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class FindAllProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(query: FindProductsQueryDto): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll({
      outletId: query.outletId,
      categoryId: query.categoryId,
      search: query.search,
      available: query.available,
      featured: query.featured,
    });
    return ProductMapper.toResponseDtoList(products);
  }
}
