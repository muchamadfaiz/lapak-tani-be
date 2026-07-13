import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { StockController } from './stock.controller';
import { StockRepository } from './repository/stock.repository';
import { StockService } from './stock.service';

@Module({
  // Stok fisik dimiliki modul Product (product_outlets) → diubah lewat
  // ProductContract. Outlet dipakai untuk validasi gudang/outlet tujuan.
  imports: [OutletModule, ProductModule],
  controllers: [StockController],
  providers: [StockRepository, StockService],
})
export class StockModule {}
