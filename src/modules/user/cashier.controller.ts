import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ResponseMessage, Roles } from '../../common';
import { CashierService } from './cashier.service';
import { CreateCashierDto, UpdateCashierDto } from './dto/cashier.dto';

@ApiTags('Cashiers (Admin)')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('cashiers')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar akun kasir' })
  @ResponseMessage('Success get cashiers')
  list() {
    return this.cashierService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Buat akun kasir (email, password, outlet)' })
  @ResponseMessage('Success create cashier')
  create(@Body() dto: CreateCashierDto) {
    return this.cashierService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah kasir (nama/outlet/aktif/reset password)' })
  @ApiParam({ name: 'id' })
  @ResponseMessage('Success update cashier')
  update(@Param('id') id: string, @Body() dto: UpdateCashierDto) {
    return this.cashierService.update(id, dto);
  }
}
