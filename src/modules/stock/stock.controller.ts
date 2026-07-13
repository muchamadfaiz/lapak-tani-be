import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ResponseMessage, Roles } from '../../common';
import {
  CreateProcurementDto,
  CreateShipmentDto,
  FindMovementsQueryDto,
  FindShipmentsQueryDto,
} from './dto';
import { StockService } from './stock.service';

@ApiTags('Stock')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly svc: StockService) {}

  @Roles('ADMIN')
  @Post('procurements')
  @ApiOperation({ summary: 'Barang masuk gudang (pengadaan)' })
  @ResponseMessage('Success create procurement')
  createProcurement(@Body() dto: CreateProcurementDto) {
    return this.svc.createProcurement(dto);
  }

  @Roles('ADMIN')
  @Get('procurements')
  @ApiOperation({ summary: 'Riwayat pengadaan (supplier & harga modal)' })
  @ResponseMessage('Success get procurements')
  findProcurements(@Query('outletId') outletId?: string) {
    return this.svc.findProcurements(outletId);
  }

  @Roles('ADMIN')
  @Post('shipments')
  @ApiOperation({ summary: 'Kirim barang gudang → outlet (stok asal langsung turun)' })
  @ResponseMessage('Success create shipment')
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.svc.createShipment(dto);
  }

  @Roles('ADMIN')
  @Get('shipments')
  @ApiOperation({
    summary: 'Daftar kiriman. Kasir: filter toOutletId + status=sent',
  })
  @ResponseMessage('Success get shipments')
  findShipments(@Query() query: FindShipmentsQueryDto) {
    return this.svc.findShipments(query);
  }

  @Roles('ADMIN')
  @Get('shipments/:id')
  @ApiOperation({ summary: 'Detail kiriman' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Success get shipment')
  findShipmentById(@Param('id') id: string) {
    return this.svc.findShipmentById(id);
  }

  @Roles('ADMIN')
  @Patch('shipments/:id/receive')
  @ApiOperation({ summary: 'Terima kiriman (dipakai aplikasi kasir) → stok outlet naik' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Success receive shipment')
  receive(@Param('id') id: string) {
    return this.svc.receiveShipment(id);
  }

  @Roles('ADMIN')
  @Patch('shipments/:id/cancel')
  @ApiOperation({ summary: 'Batalkan kiriman (stok kembali ke outlet asal)' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Success cancel shipment')
  cancel(@Param('id') id: string) {
    return this.svc.cancelShipment(id);
  }

  @Roles('ADMIN')
  @Get('movements')
  @ApiOperation({ summary: 'Riwayat pergerakan stok (buku besar)' })
  @ResponseMessage('Success get stock movements')
  findMovements(@Query() query: FindMovementsQueryDto) {
    return this.svc.findMovements(query);
  }
}
