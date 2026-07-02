import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { CustomerLookupDto, SetPinDto, VerifyPinDto } from './dto';
import { LookupCustomerUseCase, SetPinUseCase, VerifyPinUseCase } from './use-cases';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly lookupCustomer: LookupCustomerUseCase,
    private readonly setPin: SetPinUseCase,
    private readonly verifyPin: VerifyPinUseCase,
  ) {}

  @Public()
  @Get('lookup')
  @ApiOperation({
    summary: 'Lihat poin & riwayat pesanan pelanggan by No HP (tanpa login)',
  })
  @ApiQuery({ name: 'phone', example: '081234567890' })
  @ApiHeader({ name: 'x-otp-token', required: false, description: 'Token sesi HP (bila OTP aktif)' })
  @ApiResponse({ status: 200, type: CustomerLookupDto })
  @ResponseMessage('Success lookup customer')
  lookup(
    @Query('phone') phone: string,
    @Headers('x-otp-token') otpToken?: string,
  ): Promise<CustomerLookupDto> {
    return this.lookupCustomer.execute(phone, otpToken);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('pin')
  @ApiOperation({ summary: 'Set/ganti PIN login cepat (butuh token sesi WA)' })
  @ApiHeader({ name: 'x-otp-token', required: true, description: 'Token sesi HP dari login WA instan' })
  @ResponseMessage('Success set PIN')
  setPinHandler(
    @Body() dto: SetPinDto,
    @Headers('x-otp-token') otpToken?: string,
  ): Promise<{ ok: boolean; phone: string }> {
    return this.setPin.execute(dto.pin, otpToken);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('pin/verify')
  @ApiOperation({ summary: 'Login cepat dengan PIN → token sesi HP' })
  @ResponseMessage('Success verify PIN')
  verifyPinHandler(
    @Body() dto: VerifyPinDto,
  ): Promise<{ valid: boolean; token: string }> {
    return this.verifyPin.execute(dto.phone, dto.pin);
  }
}
