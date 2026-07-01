import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpContract } from './otp.contract';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpContract) {}

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
}
