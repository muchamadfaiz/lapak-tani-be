import { ConflictException, Injectable } from '@nestjs/common';
import { CategoryContract } from '../../category';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';
import {
  assertOriginalPriceAbovePrice,
  BARCODE_CONFLICT_MESSAGE,
  normalizeProductBarcode,
} from '../product.util';

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

    assertOriginalPriceAbovePrice(dto.originalPrice, dto.price);

    const barcode = normalizeProductBarcode(dto.barcode);
    if (
      barcode &&
      (await this.productRepository.findActiveByBarcode(barcode))
    ) {
      throw new ConflictException(BARCODE_CONFLICT_MESSAGE);
    }

    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      costPrice: dto.costPrice,
      originalPrice: dto.originalPrice ?? null,
      tags: dto.tags ?? [],
      unit: dto.unit,
      imageUrl: dto.imageUrl,
      categoryId: dto.categoryId,
      isAvailable: dto.isAvailable,
      isFeatured: dto.isFeatured,
      soldByWeight: dto.soldByWeight,
      barcode,
    });

    // Stok awal 0. Isi stok lewat menu Stok (pengadaan) agar tercatat di buku besar.
    // Ambil ulang agar outletStocks terisi di response.
    const fresh = await this.productRepository.findById(product.id);
    return ProductMapper.toAdminResponseDto(
      fresh,
      await this.outletContract.findWarehouseIds(),
    );
  }
}
