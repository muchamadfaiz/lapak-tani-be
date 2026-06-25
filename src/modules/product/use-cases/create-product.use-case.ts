import { Injectable } from '@nestjs/common';
import { CategoryContract } from '../../category';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryContract: CategoryContract,
    private readonly outletContract: OutletContract,
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Validasi referensi lintas-modul lewat contract (bukan FK DB).
    await this.categoryContract.assertExists(dto.categoryId);
    await this.outletContract.assertExists(dto.outletId);

    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      costPrice: dto.costPrice,
      unit: dto.unit,
      imageUrl: dto.imageUrl,
      categoryId: dto.categoryId,
      outletId: dto.outletId,
      stock: dto.stock,
      isAvailable: dto.isAvailable,
    });
    return ProductMapper.toResponseDto(product);
  }
}
