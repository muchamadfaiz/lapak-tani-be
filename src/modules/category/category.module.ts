import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './repository/category.repository';
import { CategoryContract } from './category.contract';
import { CategoryService } from './category.service';
import {
  CreateCategoryUseCase,
  FindAllCategoriesUseCase,
  FindCategoryByIdUseCase,
  UpdateCategoryUseCase,
  RemoveCategoryUseCase,
} from './use-cases';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryRepository,
    { provide: CategoryContract, useClass: CategoryService },
    CreateCategoryUseCase,
    FindAllCategoriesUseCase,
    FindCategoryByIdUseCase,
    UpdateCategoryUseCase,
    RemoveCategoryUseCase,
  ],
  // Hanya kontrak publik yang diekspos ke modul lain (mis. Product).
  exports: [CategoryContract],
})
export class CategoryModule {}
