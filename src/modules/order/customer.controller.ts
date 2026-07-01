import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { CustomerLookupDto } from './dto';
import { LookupCustomerUseCase } from './use-cases';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly lookupCustomer: LookupCustomerUseCase) {}

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
}
