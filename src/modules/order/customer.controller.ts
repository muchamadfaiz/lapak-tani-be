import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, type: CustomerLookupDto })
  @ResponseMessage('Success lookup customer')
  lookup(@Query('phone') phone: string): Promise<CustomerLookupDto> {
    return this.lookupCustomer.execute(phone);
  }
}
