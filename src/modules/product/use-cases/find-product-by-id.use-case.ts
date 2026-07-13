import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class FindProductByIdUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly outletContract: OutletContract,
  ) {}

  async execute(id: string, asAdmin = false): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // Stok gudang tak dihitung sebagai stok jual.
    const warehouseIds = await this.outletContract.findWarehouseIds();
    return asAdmin
      ? ProductMapper.toAdminResponseDto(product, warehouseIds)
      : ProductMapper.toDetailDto(product, warehouseIds);
  }
}
