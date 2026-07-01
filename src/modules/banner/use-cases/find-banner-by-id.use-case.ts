import { Injectable, NotFoundException } from '@nestjs/common';
import { BannerRepository } from '../repository/banner.repository';
import { BannerResponseDto } from '../dto';
import { BannerMapper } from '../mapper/banner.mapper';

@Injectable()
export class FindBannerByIdUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(id: string): Promise<BannerResponseDto> {
    const banner = await this.bannerRepository.findById(id);
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }
    return BannerMapper.toResponseDto(banner);
  }
}
