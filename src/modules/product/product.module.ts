import { Module } from '@nestjs/common';
import { CategoryModule } from '../category';
import { OutletModule } from '../outlet';
import { ProductController } from './product.controller';
import { ProductRepository } from './repository/product.repository';
import { ProductContract } from './product.contract';
import { ProductService } from './product.service';
import {
  CreateProductUseCase,
  FindAllProductsUseCase,
  FindProductByIdUseCase,
  UpdateProductUseCase,
  RemoveProductUseCase,
  FindStockLevelsUseCase,
} from './use-cases';

@Module({
  // Impor modul lain untuk memakai CategoryContract & OutletContract (validasi).
  imports: [CategoryModule, OutletModule],
  controllers: [ProductController],
  providers: [
    ProductRepository,
    { provide: ProductContract, useClass: ProductService },
    CreateProductUseCase,
    FindAllProductsUseCase,
    FindProductByIdUseCase,
    UpdateProductUseCase,
    RemoveProductUseCase,
    FindStockLevelsUseCase,
  ],
  // Hanya kontrak publik yang diekspos ke modul lain (Order).
  exports: [ProductContract],
})
export class ProductModule {}
