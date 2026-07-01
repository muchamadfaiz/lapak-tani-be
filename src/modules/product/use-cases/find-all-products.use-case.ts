import { Injectable } from '@nestjs/common';
import { PageMetaDto } from '../../../common';
import { ProductRepository } from '../repository/product.repository';
import { FindProductsQueryDto, ProductResponseDto } from '../dto';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class FindAllProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    query: FindProductsQueryDto,
  ): Promise<{ data: ProductResponseDto[]; meta: PageMetaDto }> {
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
      data: ProductMapper.toResponseDtoList(products, query.outletId),
      meta: new PageMetaDto({
        page: query.page,
        limit: query.limit,
        totalData,
      }),
    };
  }
}
