import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { CreateSnapDto } from './dto/create-snap.dto';
import { TestGatewayDto } from './dto/test-gateway.dto';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly xendit: XenditService,
  ) {}

  @Public()
  @Post('checkout')
  @ApiOperation({ summary: 'Buat halaman bayar Xendit untuk order (guest)' })
  @ApiResponse({ status: 201, description: '{ paymentUrl, referenceId }' })
  @ApiResponse({
    status: 400,
    description: 'Pembayaran online nonaktif / order sudah diproses',
  })
  @ResponseMessage('Success create payment')
  createCheckout(@Body() dto: CreateSnapDto) {
    return this.paymentService.createCheckout(dto.orderId);
  }

  /**
   * DEPRECATED — alias untuk aplikasi yang SUDAH terpasang dan masih memanggil
   * `/payments/snap` (era Midtrans). Bentuk response `{ token, redirectUrl }`
   * dipertahankan agar WebView app lama tetap jalan; `redirectUrl` kini berisi
   * URL invoice Xendit. Hapus setelah semua klien pindah ke `/payments/checkout`.
   */
  @Public()
  @Post('snap')
  @ApiOperation({ summary: '[Deprecated] Alias dari /payments/checkout' })
  @ResponseMessage('Success create payment')
  async createSnap(@Body() dto: CreateSnapDto) {
    const { paymentUrl, referenceId } =
      await this.paymentService.createCheckout(dto.orderId);
    return { token: referenceId, redirectUrl: paymentUrl };
  }

  @Public()
  @Get('status/:orderId')
  @ApiOperation({
    summary: 'Status pembayaran order (polling app): PAID/PENDING/CANCELLED',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID (bukan orderNumber)' })
  @ResponseMessage('Success get payment status')
  getStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }

  @Public()
  @Post('xendit/callback')
  @ApiOperation({
    summary: 'Webhook Xendit — diverifikasi lewat header x-callback-token',
  })
  @ApiResponse({ status: 201, description: 'OK' })
  handleCallback(
    @Headers('x-callback-token') token: string | undefined,
    @Req() req: Request,
  ) {
    return this.paymentService.handleCallback(token, req.body);
  }

  /**
   * Uji kredensial gerbang tanpa membuat transaksi apa pun. Ditaruh di modul
   * Payment (bukan Setting) karena hanya modul ini yang boleh bicara dengan
   * Xendit — sekaligus menghindari ketergantungan melingkar antar modul.
   */
  @Roles('ADMIN')
  @Post('gateway/test')
  @ApiOperation({
    summary: 'Tes koneksi kredensial Xendit (Admin) — tidak membuat transaksi',
  })
  @ApiResponse({ status: 201, description: '{ ok, mode, message }' })
  @ResponseMessage('Success test payment gateway')
  testGateway(@Body() dto: TestGatewayDto) {
    return this.xendit.testConnection(dto.secretKey);
  }
}
