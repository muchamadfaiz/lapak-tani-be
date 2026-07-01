import { Injectable } from '@nestjs/common';
import { BannerRepository } from '../repository/banner.repository';
import { BannerResponseDto } from '../dto';
import { BannerMapper } from '../mapper/banner.mapper';

@Injectable()
export class FindAllBannersUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(onlyActive = false): Promise<BannerResponseDto[]> {
    const banners = onlyActive
      ? await this.bannerRepository.findAllActive()
      : await this.bannerRepository.findAll();
    return BannerMapper.toResponseDtoList(banners);
  }
}
