import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryContract } from '../../category';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { UpdateProductDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryContract: CategoryContract,
    private readonly outletContract: OutletContract,
  ) {}

  async execute(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId !== undefined) {
      await this.categoryContract.assertExists(dto.categoryId);
    }
    if (dto.outletId !== undefined) {
      await this.outletContract.assertExists(dto.outletId);
    }

    const product = await this.productRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.outletId !== undefined && { outletId: dto.outletId }),
      ...(dto.stock !== undefined && { stock: dto.stock }),
      ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
    });
    return ProductMapper.toResponseDto(product);
  }
}
