import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repository/product.repository';
import { ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class FindProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return ProductMapper.toResponseDto(product);
  }
}
