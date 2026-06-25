import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
import { NotificationModule } from '../notification';
import { OrderController } from './order.controller';
import { OrderRepository } from './repository/order.repository';
import { CustomerRepository } from './repository/customer.repository';
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
    CreateOrderUseCase,
    FindAllOrdersUseCase,
    FindOrderByIdUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrderModule {}
