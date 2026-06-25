import {
  Body,
  Controller,
  Get,
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
  CreateOrderDto,
  UpdateOrderStatusDto,
  FindOrdersQueryDto,
} from './dto';
import {
  CreateOrderUseCase,
  FindAllOrdersUseCase,
  FindOrderByIdUseCase,
  UpdateOrderStatusUseCase,
} from './use-cases';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly findAllOrdersUseCase: FindAllOrdersUseCase,
    private readonly findOrderByIdUseCase: FindOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Checkout — buat order (publik/guest, wajib No HP)',
  })
  @ApiResponse({ status: 201, description: 'Order dibuat (+ whatsappUrl)' })
  @ApiResponse({ status: 400, description: 'Validasi gagal (stok/outlet/produk)' })
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
