import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { NotificationModule } from '../notification';
import { OrderController } from './order.controller';
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
} from './use-cases';

@Module({
  // Pakai OutletContract & ProductContract untuk validasi + data snapshot,
  // NotificationContract untuk memberi tahu admin saat ada pesanan baru.
  imports: [OutletModule, ProductModule, NotificationModule],
  controllers: [OrderController],
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
  ],
  exports: [OrderContract],
})
export class OrderModule {}
