import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import {
  CreateProductDto,
  UpdateProductDto,
  FindProductsQueryDto,
} from './dto';
import {
  CreateProductUseCase,
  FindAllProductsUseCase,
  FindProductByIdUseCase,
  UpdateProductUseCase,
  RemoveProductUseCase,
} from './use-cases';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly removeProductUseCase: RemoveProductUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List produk (publik). Filter: outletId, categoryId, search, available',
  })
  @ApiResponse({ status: 200, description: 'Daftar produk' })
  @ResponseMessage('Success get products')
  findAll(@Query() query: FindProductsQueryDto) {
    return this.findAllProductsUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detail produk (publik)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Produk ditemukan' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @ResponseMessage('Success get product')
  findById(@Param('id') id: string) {
    return this.findProductByIdUseCase.execute(id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Buat produk (Admin)' })
  @ApiResponse({ status: 201, description: 'Produk dibuat' })
  @ApiResponse({ status: 404, description: 'Kategori/Outlet tidak ditemukan' })
  @ResponseMessage('Success create product')
  create(@Body() dto: CreateProductDto) {
    return this.createProductUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update produk (Admin)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Produk diperbarui' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @ResponseMessage('Success update product')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProductUseCase.execute(id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus produk (Admin)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 204, description: 'Produk dihapus' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @ResponseMessage('Success delete product')
  remove(@Param('id') id: string) {
    return this.removeProductUseCase.execute(id);
  }
}
