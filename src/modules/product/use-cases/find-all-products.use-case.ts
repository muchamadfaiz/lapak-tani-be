import { Injectable } from '@nestjs/common';
import { PageMetaDto } from '../../../common';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { FindProductsQueryDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly outletContract: OutletContract,
  ) {}

  async execute(
    query: FindProductsQueryDto,
  ): Promise<{ data: ProductResponseDto[]; meta: PageMetaDto }> {
    // Stok gudang dikecualikan dari total (belum bisa dijual).
    const warehouseIds = query.outletId
      ? []
      : await this.outletContract.findWarehouseIds();

    const [products, totalData] = await this.productRepository.findAndCount(
      {
        categoryId: query.categoryId,
        search: query.search,
        available: query.available,
        featured: query.featured,
      },
      {
        skip: query.skip,
        take: query.limit,
        // Default urut nama (A→Z) seperti sebelumnya; bisa dioverride via sortBy.
        orderBy: query.sortBy
          ? { [query.sortBy]: query.order }
          : { name: 'asc' },
      },
    );

    return {
      // outletId (bila ada) → stok yg ditampilkan = stok outlet itu.
      // Tanpa outletId → total stok JUAL (semua outlet, tanpa gudang).
      data: ProductMapper.toResponseDtoList(
        products,
        query.outletId,
        warehouseIds,
      ),
      meta: new PageMetaDto({
        page: query.page,
        limit: query.limit,
        totalData,
      }),
    };
  }
}
