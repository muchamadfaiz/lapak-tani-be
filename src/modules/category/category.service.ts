import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoryRepository } from './repository/category.repository';
import { CategoryContract, CategoryRef } from './category.contract';

/**
 * Implementasi CategoryContract — memenuhi janji lintas-modul. CRUD kategori
 * milik modul ini sendiri (endpoint /categories) tetap di use-case.
 */
@Injectable()
export class CategoryService extends CategoryContract {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super();
  }

  async findById(id: string): Promise<CategoryRef | null> {
    const category = await this.categoryRepository.findById(id);
    return category ? CategoryService.toRef(category) : null;
  }

  async assertExists(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private static toRef(category: Category): CategoryRef {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      imageUrl: category.imageUrl,
    };
  }
}
