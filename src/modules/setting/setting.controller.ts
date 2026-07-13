import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SETTING_KEYS, PublicPaymentSettings } from './setting.contract';
import { SettingService } from './setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly svc: SettingService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary: 'Pengaturan pembayaran untuk pelanggan (storefront & app)',
  })
  @ResponseMessage('Success get public settings')
  getPublic(): Promise<PublicPaymentSettings> {
    return this.svc.getPublicPaymentSettings();
  }

  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Semua pengaturan (Admin)' })
  @ResponseMessage('Success get settings')
  getAll(): Promise<PublicPaymentSettings> {
    return this.svc.getPublicPaymentSettings();
  }

  @Roles('ADMIN')
  @Patch()
  @ApiOperation({ summary: 'Ubah pengaturan (Admin)' })
  @ResponseMessage('Success update settings')
  async update(@Body() dto: UpdateSettingsDto): Promise<PublicPaymentSettings> {
    const patch: Record<string, string> = {};
    if (dto.onlinePaymentEnabled !== undefined) {
      patch[SETTING_KEYS.onlinePaymentEnabled] = String(dto.onlinePaymentEnabled);
    }
    if (dto.bankName !== undefined) patch[SETTING_KEYS.bankName] = dto.bankName;
    if (dto.bankAccountNumber !== undefined) {
      patch[SETTING_KEYS.bankAccountNumber] = dto.bankAccountNumber;
    }
    if (dto.bankAccountName !== undefined) {
      patch[SETTING_KEYS.bankAccountName] = dto.bankAccountName;
    }
    await this.svc.update(patch);
    return this.svc.getPublicPaymentSettings();
  }
}
