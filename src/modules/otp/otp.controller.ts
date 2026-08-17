import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { RequestOtpDto } from './dto/request-otp.dto';
import { TestWhatsappDto } from './dto/test-whatsapp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpContract } from './otp.contract';
import { FonnteService } from './whatsapp/fonnte.service';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(
    private readonly otp: OtpContract,
    private readonly fonnte: FonnteService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // anti spam: 5 req/menit/IP
  @Post('request')
  @ApiOperation({ summary: 'Minta kode OTP via WhatsApp (Fonnte)' })
  @ResponseMessage('OTP dikirim')
  request(@Body() dto: RequestOtpDto) {
    return this.otp.requestOtp(dto.phone, dto.purpose);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify')
  @ApiOperation({ summary: 'Verifikasi kode OTP → token sesi HP' })
  @ResponseMessage('OTP terverifikasi')
  async verify(@Body() dto: VerifyOtpDto) {
    await this.otp.verifyOtp(dto.phone, dto.code, dto.purpose); // throw bila salah
    const token = this.otp.issuePhoneToken(dto.phone);
    return { valid: true, token };
  }

  /**
   * Uji token Fonnte TANPA mengirim pesan ke siapa pun. Ditaruh di modul OTP
   * (bukan Setting) karena hanya modul ini yang boleh bicara dengan Fonnte —
   * sekaligus menghindari ketergantungan melingkar antar modul.
   *
   * Melaporkan status perangkat, bukan cuma keabsahan token: Fonnte gagal
   * diam-diam bila perangkat WhatsApp-nya lepas dari sesi.
   */
  @Roles('ADMIN')
  @Post('gateway/test')
  @ApiOperation({
    summary: 'Tes token & perangkat Fonnte (Admin) — tidak mengirim pesan',
  })
  @ApiResponse({ status: 201, description: '{ ok, connected, quota, message }' })
  @ResponseMessage('Success test whatsapp gateway')
  testGateway(@Body() dto: TestWhatsappDto) {
    return this.fonnte.checkDevice(dto.fonnteToken);
  }
}
