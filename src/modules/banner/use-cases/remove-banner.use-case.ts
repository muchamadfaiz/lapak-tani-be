import { Injectable, NotFoundException } from '@nestjs/common';
import { BannerRepository } from '../repository/banner.repository';

@Injectable()
export class RemoveBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.bannerRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Banner not found');
    }
    await this.bannerRepository.delete(id);
  }
}
