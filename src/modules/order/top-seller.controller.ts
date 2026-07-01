import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { FindTopSellersQueryDto, TopSellerResponseDto } from './dto';
import { FindTopSellersUseCase } from './use-cases';

@ApiTags('Products')
@Controller('top-seller')
export class TopSellerController {
  constructor(private readonly findTopSellers: FindTopSellersUseCase) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Produk terlaris (publik). Default 10, dari order completed',
  })
  @ApiResponse({ status: 200, type: [TopSellerResponseDto] })
  @ResponseMessage('Success get top sellers')
  findAll(
    @Query() query: FindTopSellersQueryDto,
  ): Promise<TopSellerResponseDto[]> {
    return this.findTopSellers.execute(query.limit);
  }
}
