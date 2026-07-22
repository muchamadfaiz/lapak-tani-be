import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  FindOrdersQueryDto,
} from './dto';
import {
  CreateOrderUseCase,
  FindAllOrdersUseCase,
  FindOrderByIdUseCase,
  UpdateOrderStatusUseCase,
  UploadPaymentProofUseCase,
} from './use-cases';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly findAllOrdersUseCase: FindAllOrdersUseCase,
    private readonly findOrderByIdUseCase: FindOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly uploadPaymentProofUseCase: UploadPaymentProofUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':id/payment-proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Unggah bukti transfer untuk order (pelanggan)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ResponseMessage('Success upload payment proof')
  uploadPaymentProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadPaymentProofUseCase.execute(id, file);
  }

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Checkout — buat order (publik/guest, wajib No HP)',
  })
  @ApiResponse({ status: 201, description: 'Order dibuat (+ whatsappUrl)' })
  @ApiResponse({
    status: 400,
    description: 'Validasi gagal (stok/outlet/produk)',
  })
  @ResponseMessage('Success create order')
  create(@Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'List order (Admin). Filter: status, outletId' })
  @ApiResponse({ status: 200, description: 'Daftar order' })
  @ResponseMessage('Success get orders')
  findAll(@Query() query: FindOrdersQueryDto) {
    return this.findAllOrdersUseCase.execute(query);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Detail order (Admin)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order ditemukan' })
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan' })
  @ResponseMessage('Success get order')
  findById(@Param('id') id: string) {
    return this.findOrderByIdUseCase.execute(id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Ubah status order (Admin)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Status diperbarui' })
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan' })
  @ResponseMessage('Success update order status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.updateOrderStatusUseCase.execute(id, dto);
  }
}
