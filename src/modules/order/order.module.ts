import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { NotificationModule } from '../notification';
import { OtpModule } from '../otp';
import { DistanceModule } from '../distance';
import { FileModule } from '../file';
import { StockModule } from '../stock';
import { OrderController } from './order.controller';
import { CustomerController } from './customer.controller';
import { TopSellerController } from './top-seller.controller';
import { OrderRepository } from './repository/order.repository';
import { CustomerRepository } from './repository/customer.repository';
import { OrderContract } from './order.contract';
import { OrderService } from './order.service';
import { OrderExpiryScheduler } from './order-expiry.scheduler';
import {
  CreateOrderUseCase,
  FindAllOrdersUseCase,
  FindOrderByIdUseCase,
  UpdateOrderStatusUseCase,
  LookupCustomerUseCase,
  FindTopSellersUseCase,
  SetPinUseCase,
  VerifyPinUseCase,
  UploadPaymentProofUseCase,
} from './use-cases';

@Module({
  // Pakai OutletContract & ProductContract untuk validasi + data snapshot,
  // NotificationContract untuk memberi tahu admin saat ada pesanan baru.
  // FileModule → FileContract (URL unggahan) + MulterModule (FileInterceptor).
  imports: [
    OutletModule,
    ProductModule,
    NotificationModule,
    OtpModule,
    DistanceModule,
    FileModule,
    // StockContract → catat penjualan/pembatalan ke buku besar stok.
    StockModule,
  ],
  controllers: [OrderController, CustomerController, TopSellerController],
  providers: [
    OrderRepository,
    CustomerRepository,
    OrderService,
    { provide: OrderContract, useExisting: OrderService },
    OrderExpiryScheduler,
    CreateOrderUseCase,
    FindAllOrdersUseCase,
    FindOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    LookupCustomerUseCase,
    FindTopSellersUseCase,
    SetPinUseCase,
    VerifyPinUseCase,
    UploadPaymentProofUseCase,
  ],
  exports: [OrderContract],
})
export class OrderModule {}
