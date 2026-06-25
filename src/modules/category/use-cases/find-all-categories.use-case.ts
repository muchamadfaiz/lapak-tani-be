import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository';
import { CategoryResponseDto } from '../dto';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class FindAllCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return CategoryMapper.toResponseDtoList(categories);
  }
}
