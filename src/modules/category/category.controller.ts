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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import {
  CreateCategoryUseCase,
  FindAllCategoriesUseCase,
  FindCategoryByIdUseCase,
  UpdateCategoryUseCase,
  RemoveCategoryUseCase,
} from './use-cases';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly findAllCategoriesUseCase: FindAllCategoriesUseCase,
    private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly removeCategoryUseCase: RemoveCategoryUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List semua kategori (publik)' })
  @ApiResponse({ status: 200, description: 'Daftar kategori' })
  @ResponseMessage('Success get categories')
  findAll() {
    return this.findAllCategoriesUseCase.execute();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detail kategori (publik)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Kategori ditemukan' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ResponseMessage('Success get category')
  findById(@Param('id') id: string) {
    return this.findCategoryByIdUseCase.execute(id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Buat kategori (Admin)' })
  @ApiResponse({ status: 201, description: 'Kategori dibuat' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  @ResponseMessage('Success create category')
  create(@Body() dto: CreateCategoryDto) {
    return this.createCategoryUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update kategori (Admin)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Kategori diperbarui' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ResponseMessage('Success update category')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.updateCategoryUseCase.execute(id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus kategori (Admin)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Kategori dihapus' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ResponseMessage('Success delete category')
  remove(@Param('id') id: string) {
    return this.removeCategoryUseCase.execute(id);
  }
}
