import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository';
import { CategoryResponseDto } from '../dto';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class FindCategoryByIdUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return CategoryMapper.toResponseDto(category);
  }
}
