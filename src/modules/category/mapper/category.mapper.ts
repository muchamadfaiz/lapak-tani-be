import { Category } from '@prisma/client';
import { CategoryResponseDto } from '../dto';

export class CategoryMapper {
  static toResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toResponseDtoList(categories: Category[]): CategoryResponseDto[] {
    return categories.map((c) => CategoryMapper.toResponseDto(c));
  }
}
