import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseMessage, Roles } from '../../common';
import { CreatePosSaleDto, CloseShiftDto, OpenShiftDto } from './dto';
import { PosService } from './pos.service';

/**
 * Endpoint aplikasi kasir (POS). Semua terikat outlet kasir dari JWT — ADMIN
 * diizinkan untuk keperluan pengujian, tapi ADMIN tanpa outletId akan ditolak
 * pada operasi yang memerlukan outlet.
 */
@ApiTags('POS (Kasir)')
@ApiBearerAuth()
@Roles('KASIR', 'ADMIN')
@Controller('pos')
export class PosController {
  constructor(private readonly pos: PosService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil kasir + outlet tempat bertugas' })
  @ResponseMessage('Success get profile')
  me(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @CurrentUser('role') role: string,
    @CurrentUser('outletId') outletId: string | null,
  ) {
    return this.pos.getMe(userId, email, role, outletId);
  }

  @Get('me/shift')
  @ApiOperation({ summary: 'Sesi kasir yang sedang terbuka (null bila belum buka)' })
  @ResponseMessage('Success get active shift')
  activeShift(@CurrentUser('id') userId: string) {
    return this.pos.getActiveShift(userId);
  }

  @Post('shift/open')
  @ApiOperation({ summary: 'Buka sesi kasir (input modal kas awal)' })
  @ResponseMessage('Success open shift')
  openShift(
    @CurrentUser('id') userId: string,
    @CurrentUser('outletId') outletId: string | null,
    @Body() dto: OpenShiftDto,
  ) {
    return this.pos.openShift(userId, outletId, dto);
  }

  @Post('shift/close')
  @ApiOperation({ summary: 'Tutup sesi kasir + rekap kas' })
  @ResponseMessage('Success close shift')
  closeShift(@CurrentUser('id') userId: string, @Body() dto: CloseShiftDto) {
    return this.pos.closeShift(userId, dto);
  }

  @Post('sales')
  @ApiOperation({ summary: 'Transaksi penjualan di kasir → struk' })
  @ResponseMessage('Success create sale')
  createSale(
    @CurrentUser('id') userId: string,
    @CurrentUser('outletId') outletId: string | null,
    @Body() dto: CreatePosSaleDto,
  ) {
    return this.pos.createSale(userId, outletId, dto);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Transaksi pada sesi kasir yang berjalan' })
  @ResponseMessage('Success get shift sales')
  shiftSales(@CurrentUser('id') userId: string) {
    return this.pos.getShiftSales(userId);
  }

  @Get('shipments/incoming')
  @ApiOperation({ summary: 'Kiriman menuju outlet kasir yang belum diterima' })
  @ResponseMessage('Success get incoming shipments')
  incoming(@CurrentUser('outletId') outletId: string | null) {
    return this.pos.listIncoming(outletId);
  }

  @Patch('shipments/:id/receive')
  @ApiOperation({ summary: 'Terima kiriman → stok outlet naik' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Success receive shipment')
  receive(
    @CurrentUser('outletId') outletId: string | null,
    @Param('id') id: string,
  ) {
    return this.pos.receiveShipment(outletId, id);
  }

  // ── Laporan (khusus ADMIN) ──
  @Roles('ADMIN')
  @Get('shifts')
  @ApiOperation({ summary: 'Laporan shift kasir (admin) — filter outlet & tanggal' })
  @ResponseMessage('Success get shift reports')
  shiftReports(
    @Query('outletId') outletId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.pos.getShiftReports({ outletId, dateFrom, dateTo });
  }
}
