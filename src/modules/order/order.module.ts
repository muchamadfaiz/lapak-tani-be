import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { ProductModule } from '../product';
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
  // Pakai OutletContract & ProductContract untuk validasi + data snapshot.
  imports: [OutletModule, ProductModule],
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
