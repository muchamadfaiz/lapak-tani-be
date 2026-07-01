import { Banner } from '@prisma/client';
import { BannerResponseDto } from '../dto';

export class BannerMapper {
  static toResponseDto(banner: Banner): BannerResponseDto {
    return {
      id: banner.id,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      startDate: banner.startDate,
      endDate: banner.endDate,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
  }

  static toResponseDtoList(banners: Banner[]): BannerResponseDto[] {
    return banners.map((b) => BannerMapper.toResponseDto(b));
  }
}
