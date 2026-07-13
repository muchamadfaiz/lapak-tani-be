import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { StockController } from './stock.controller';
import { StockRepository } from './repository/stock.repository';
import { StockContract } from './stock.contract';
import { StockService } from './stock.service';

@Module({
  // Stok fisik dimiliki modul Product (product_outlets) → diubah lewat
  // ProductContract. Outlet dipakai untuk validasi gudang/outlet tujuan.
  imports: [OutletModule, ProductModule],
  controllers: [StockController],
  providers: [
    StockRepository,
    StockService,
    { provide: StockContract, useExisting: StockService },
  ],
  // Order memakai kontrak ini untuk mencatat penjualan ke buku besar.
  exports: [StockContract],
})
export class StockModule {}
