import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post('snap')
  @ApiOperation({ summary: 'Buat transaksi Snap Midtrans untuk order (guest)' })
  @ApiResponse({ status: 201, description: '{ token, redirectUrl }' })
  @ApiResponse({ status: 400, description: 'Pembayaran online belum aktif / order sudah diproses' })
  @ResponseMessage('Success create payment')
  createSnap(@Body() dto: CreateSnapDto) {
    return this.paymentService.createSnap(dto.orderId);
  }

  @Public()
  @Post('midtrans/notification')
  @ApiOperation({ summary: 'Webhook notifikasi Midtrans (dipanggil Midtrans)' })
  @ApiResponse({ status: 201, description: 'OK' })
  handleNotification(@Req() req: Request) {
    return this.paymentService.handleNotification(req.body);
  }
}
