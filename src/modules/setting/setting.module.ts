import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller';
import { SettingRepository } from './repository/setting.repository';
import { SettingContract } from './setting.contract';
import { SettingService } from './setting.service';

@Module({
  controllers: [SettingController],
  providers: [
    SettingRepository,
    SettingService,
    { provide: SettingContract, useExisting: SettingService },
  ],
  // Hanya kontrak publik yang diekspos (dipakai modul Payment).
  exports: [SettingContract],
})
export class SettingModule {}
