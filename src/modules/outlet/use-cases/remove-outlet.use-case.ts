import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';

@Injectable()
export class RemoveOutletUseCase {
  constructor(private readonly outletRepository: OutletRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.outletRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Outlet not found');
    }
    await this.outletRepository.delete(id);
  }
}
