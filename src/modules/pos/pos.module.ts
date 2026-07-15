import { Module } from '@nestjs/common';
import { OrderModule } from '../order';
import { StockModule } from '../stock';
import { OutletModule } from '../outlet';
import { UserModule } from '../user';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { ShiftRepository } from './repository/shift.repository';

@Module({
  // Transaksi penjualan lewat OrderContract, terima kiriman lewat StockContract,
  // OutletContract untuk info outlet, UserContract untuk nama kasir (laporan).
  imports: [OrderModule, StockModule, OutletModule, UserModule],
  controllers: [PosController],
  providers: [ShiftRepository, PosService],
})
export class PosModule {}
