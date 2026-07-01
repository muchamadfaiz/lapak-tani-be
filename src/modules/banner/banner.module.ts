import { Module } from '@nestjs/common';
import { BannerController } from './banner.controller';
import { BannerRepository } from './repository/banner.repository';
import {
  CreateBannerUseCase,
  FindAllBannersUseCase,
  FindBannerByIdUseCase,
  UpdateBannerUseCase,
  RemoveBannerUseCase,
} from './use-cases';

@Module({
  controllers: [BannerController],
  providers: [
    BannerRepository,
    CreateBannerUseCase,
    FindAllBannersUseCase,
    FindBannerByIdUseCase,
    UpdateBannerUseCase,
    RemoveBannerUseCase,
  ],
})
export class BannerModule {}
