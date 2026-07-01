import { Injectable } from '@nestjs/common';
import { BannerRepository } from '../repository/banner.repository';
import { CreateBannerDto, BannerResponseDto } from '../dto';
import { BannerMapper } from '../mapper/banner.mapper';

@Injectable()
export class CreateBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(dto: CreateBannerDto): Promise<BannerResponseDto> {
    const banner = await this.bannerRepository.create({
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      linkUrl: dto.linkUrl,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });
    return BannerMapper.toResponseDto(banner);
  }
}
