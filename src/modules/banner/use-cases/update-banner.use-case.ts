import { Injectable, NotFoundException } from '@nestjs/common';
import { BannerRepository } from '../repository/banner.repository';
import { UpdateBannerDto, BannerResponseDto } from '../dto';
import { BannerMapper } from '../mapper/banner.mapper';

@Injectable()
export class UpdateBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async execute(id: string, dto: UpdateBannerDto): Promise<BannerResponseDto> {
    const existing = await this.bannerRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Banner not found');
    }

    const banner = await this.bannerRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
    });
    return BannerMapper.toResponseDto(banner);
  }
}
