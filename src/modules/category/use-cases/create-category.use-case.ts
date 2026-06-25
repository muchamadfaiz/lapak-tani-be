import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository';
import { CreateCategoryDto, CategoryResponseDto } from '../dto';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.create({
      name: dto.name,
      icon: dto.icon,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });
    return CategoryMapper.toResponseDto(category);
  }
}
