import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repository/category.repository';

@Injectable()
export class RemoveCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryRepository.delete(id);
  }
}
