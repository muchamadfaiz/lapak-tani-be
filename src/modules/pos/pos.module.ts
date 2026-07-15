import { Module } from '@nestjs/common';
import { OrderModule } from '../order';
import { StockModule } from '../stock';
import { OutletModule } from '../outlet';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { ShiftRepository } from './repository/shift.repository';

@Module({
  // Transaksi penjualan lewat OrderContract, terima kiriman lewat StockContract,
  // OutletContract untuk info outlet kasir.
  imports: [OrderModule, StockModule, OutletModule],
  controllers: [PosController],
  providers: [ShiftRepository, PosService],
})
export class PosModule {}
