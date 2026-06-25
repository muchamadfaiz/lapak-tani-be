import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository';
import { UpdateCategoryDto, CategoryResponseDto } from '../dto';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const category = await this.categoryRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    });
    return CategoryMapper.toResponseDto(category);
  }
}
