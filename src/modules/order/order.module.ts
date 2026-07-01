import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { NotificationModule } from '../notification';
import { OtpModule } from '../otp';
import { DistanceModule } from '../distance';
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
} from './use-cases';

@Module({
  // Pakai OutletContract & ProductContract untuk validasi + data snapshot,
  // NotificationContract untuk memberi tahu admin saat ada pesanan baru.
  imports: [OutletModule, ProductModule, NotificationModule, OtpModule, DistanceModule],
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
  ],
  exports: [OrderContract],
})
export class OrderModule {}
