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
    // Catatan: stok TIDAK lagi diubah dari form produk. Perubahan stok hanya
    // lewat menu Stok (pengadaan/kiriman/koreksi) agar tercatat di buku besar.

    await this.productRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
    });

    // Ambil ulang agar stok terbaru & outletStocks terisi di response.
    const fresh = await this.productRepository.findById(id);
    return ProductMapper.toAdminResponseDto(
      fresh!,
      await this.outletContract.findWarehouseIds(),
    );
  }
}
