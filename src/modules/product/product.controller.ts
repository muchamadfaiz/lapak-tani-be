import {
  BadRequestException,
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Public, ResponseMessage, Roles } from '../../common';
import {
  CreateProductDto,
  UpdateProductDto,
  FindProductsQueryDto,
  ExportProductsQueryDto,
  ImportProductsQueryDto,
  ImportProductsResultDto,
} from './dto';
import {
  CreateProductUseCase,
  FindAllProductsUseCase,
  FindProductByIdUseCase,
  UpdateProductUseCase,
  RemoveProductUseCase,
  FindStockLevelsUseCase,
  ExportProductsUseCase,
  ImportProductsUseCase,
} from './use-cases';
import type { CsvFile } from './use-cases';

/** Batas ukuran file impor — 2000 baris produk jauh di bawah angka ini. */
const MAX_CSV_SIZE = 5 * 1024 * 1024;

/**
 * Multer khusus CSV: file ditahan di memori (tak perlu ditulis ke disk seperti
 * unggahan gambar) dan hanya menerima berkas CSV.
 */
const csvUpload = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_CSV_SIZE },
  fileFilter: (
    _req: unknown,
    file: { originalname: string; mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Mimetype CSV tidak konsisten antar-OS/browser (Excel sering mengirim
    // application/vnd.ms-editor), jadi ekstensi yang jadi patokan.
    if (!/\.csv$/i.test(file.originalname)) {
      return cb(new BadRequestException('File harus berformat .csv'), false);
    }
    cb(null, true);
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductsUseCase: FindAllProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly removeProductUseCase: RemoveProductUseCase,
    private readonly findStockLevelsUseCase: FindStockLevelsUseCase,
    private readonly exportProductsUseCase: ExportProductsUseCase,
    private readonly importProductsUseCase: ImportProductsUseCase,
  ) {}

  /**
   * Kirim CSV sebagai unduhan. Memakai @Res langsung supaya body tak dibungkus
   * ResponseInterceptor (browser harus menerima teks CSV apa adanya).
   */
  private sendCsv(res: Response, file: CsvFile): void {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    // Nama file hanya terbaca frontend beda-origin bila header ini dibuka.
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(file.content);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('export')
  @ApiOperation({
    summary: 'Ekspor produk ke CSV (Admin). Filter sama dengan daftar produk',
  })
  @ApiResponse({ status: 200, description: 'File CSV' })
  exportCsv(
    @Query() query: ExportProductsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.exportProductsUseCase
      .execute(query)
      .then((file) => this.sendCsv(res, file));
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('import/template')
  @ApiOperation({ summary: 'Unduh template CSV impor produk (Admin)' })
  @ApiResponse({ status: 200, description: 'File CSV berisi header + contoh' })
  importTemplate(@Res() res: Response): void {
    this.sendCsv(res, this.exportProductsUseCase.template());
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', csvUpload))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary:
      'Impor produk dari CSV (Admin). Baris ber-id = update, tanpa id = produk baru',
  })
  @ApiResponse({ status: 200, description: 'Ringkasan hasil impor' })
  @ApiResponse({ status: 400, description: 'File/kolom tidak valid' })
  @ResponseMessage('Success import products')
  importCsv(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Query() query: ImportProductsQueryDto,
  ): Promise<ImportProductsResultDto> {
    if (!file) {
      throw new BadRequestException('File CSV wajib diunggah (field "file")');
    }
    return this.importProductsUseCase.execute(file.buffer, query.dryRun);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'List produk (publik). Filter: outletId, categoryId, search, available',
  })
  @ApiResponse({ status: 200, description: 'Daftar produk' })
  @ResponseMessage('Success get products')
  findAll(@Query() query: FindProductsQueryDto) {
    return this.findAllProductsUseCase.execute(query);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('stock-levels')
  @ApiOperation({
    summary: 'Matriks sisa stok produk × outlet (Sisa Stok admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar stok per produk per outlet',
  })
  @ResponseMessage('Success get stock levels')
  findStockLevels() {
    return this.findStockLevelsUseCase.execute();
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get(':id/manage')
  @ApiOperation({ summary: 'Detail produk untuk admin (termasuk harga modal)' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Produk ditemukan (dengan costPrice)',
  })
  @ResponseMessage('Success get product')
  findByIdAdmin(@Param('id') id: string) {
    return this.findProductByIdUseCase.execute(id, true);
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
