import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SETTING_KEYS, PublicSettings } from './setting.contract';
import { SettingService } from './setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly svc: SettingService) {}

  @Public()
  @Get('public')
  @ApiOperation({
    summary:
      'Pengaturan pembayaran & bilah promo untuk pelanggan (storefront & app)',
  })
  @ResponseMessage('Success get public settings')
  getPublic(): Promise<PublicSettings> {
    return this.svc.getPublicSettings();
  }

  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Semua pengaturan (Admin)' })
  @ResponseMessage('Success get settings')
  getAll(): Promise<PublicSettings> {
    return this.svc.getPublicSettings();
  }

  @Roles('ADMIN')
  @Patch()
  @ApiOperation({ summary: 'Ubah pengaturan (Admin)' })
  @ResponseMessage('Success update settings')
  async update(@Body() dto: UpdateSettingsDto): Promise<PublicSettings> {
    const patch: Record<string, string> = {};
    if (dto.onlinePaymentEnabled !== undefined) {
      patch[SETTING_KEYS.onlinePaymentEnabled] = String(
        dto.onlinePaymentEnabled,
      );
    }
    if (dto.bankName !== undefined) patch[SETTING_KEYS.bankName] = dto.bankName;
    if (dto.bankAccountNumber !== undefined) {
      patch[SETTING_KEYS.bankAccountNumber] = dto.bankAccountNumber;
    }
    if (dto.bankAccountName !== undefined) {
      patch[SETTING_KEYS.bankAccountName] = dto.bankAccountName;
    }
    if (dto.promoBarEnabled !== undefined) {
      patch[SETTING_KEYS.promoBarEnabled] = String(dto.promoBarEnabled);
    }
    if (dto.promoBarTitle !== undefined) {
      patch[SETTING_KEYS.promoBarTitle] = dto.promoBarTitle;
    }
    if (dto.promoBarSubtitle !== undefined) {
      patch[SETTING_KEYS.promoBarSubtitle] = dto.promoBarSubtitle;
    }
    if (dto.shopName !== undefined) patch[SETTING_KEYS.shopName] = dto.shopName;
    if (dto.shopTagline !== undefined) {
      patch[SETTING_KEYS.shopTagline] = dto.shopTagline;
    }
    if (dto.shopLogoUrl !== undefined) {
      patch[SETTING_KEYS.shopLogoUrl] = dto.shopLogoUrl;
    }
    if (dto.shopWhatsapp !== undefined) {
      patch[SETTING_KEYS.shopWhatsapp] = dto.shopWhatsapp;
    }
    if (dto.shopServiceHours !== undefined) {
      patch[SETTING_KEYS.shopServiceHours] = dto.shopServiceHours;
    }
    await this.svc.update(patch);
    return this.svc.getPublicSettings();
  }
}
