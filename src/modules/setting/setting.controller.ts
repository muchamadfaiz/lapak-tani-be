import { Body, Controller, Get, Logger, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public, ResponseMessage, Roles } from '../../common';
import { UpdateGatewayDto } from './dto/update-gateway.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateWhatsappDto } from './dto/update-whatsapp.dto';
import { SETTING_KEYS, PublicSettings } from './setting.contract';
import { SettingService } from './setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  private readonly logger = new Logger(SettingController.name);

  constructor(private readonly svc: SettingService) {}

  // ── Gerbang pembayaran (Xendit) ───────────────────────────────────────────
  // Sengaja TIDAK ikut dalam GET /settings maupun /settings/public: dua endpoint
  // itu mengembalikan objek yang sama, dan yang satu terbuka tanpa autentikasi.
  // Kredensial pembayaran hanya boleh lewat jalur khusus di bawah ini.

  // ── Kredensial WhatsApp (Fonnte) ──────────────────────────────────────────
  // Jalur khusus, alasan sama dengan gerbang pembayaran: isinya rahasia dan
  // tidak boleh ikut /settings maupun /settings/public.

  @Roles('ADMIN')
  @Get('whatsapp')
  @ApiOperation({
    summary:
      'Kredensial WhatsApp/OTP (Admin). Token hanya ditampilkan tersamar.',
  })
  @ResponseMessage('Success get whatsapp settings')
  getWhatsapp() {
    return this.svc.getOtpAdminView();
  }

  @Roles('ADMIN')
  @Patch('whatsapp')
  @ApiOperation({
    summary: 'Ubah kredensial WhatsApp/OTP (Admin). Token kosong = tidak diubah.',
  })
  @ResponseMessage('Success update whatsapp settings')
  async updateWhatsapp(
    @Body() dto: UpdateWhatsappDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.svc.updateOtp(dto);
    const berubah = Object.keys(dto).filter(
      (k) => dto[k as keyof UpdateWhatsappDto] !== undefined,
    );
    this.logger.log(
      `Kredensial WhatsApp diubah oleh user ${userId} — field: ${berubah.join(', ')}`,
    );
    return this.svc.getOtpAdminView();
  }

  @Roles('ADMIN')
  @Get('payment-gateway')
  @ApiOperation({
    summary:
      'Kredensial gerbang pembayaran (Admin). Kunci hanya ditampilkan tersamar.',
  })
  @ResponseMessage('Success get payment gateway settings')
  getGateway() {
    return this.svc.getXenditAdminView();
  }

  @Roles('ADMIN')
  @Patch('payment-gateway')
  @ApiOperation({
    summary:
      'Ubah kredensial gerbang pembayaran (Admin). Kunci kosong = tidak diubah.',
  })
  @ResponseMessage('Success update payment gateway settings')
  async updateGateway(
    @Body() dto: UpdateGatewayDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.svc.updateXendit(dto);
    // Jejak audit: catat SIAPA yang mengubah kredensial pembayaran — tidak
    // pernah nilainya.
    const berubah = Object.keys(dto).filter(
      (k) => dto[k as keyof UpdateGatewayDto] !== undefined,
    );
    this.logger.log(
      `Kredensial gerbang pembayaran diubah oleh user ${userId} — field: ${berubah.join(', ')}`,
    );
    return this.svc.getXenditAdminView();
  }

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
    // `false` = tampilkan NIAT admin, bukan nilai efektif. Kalau tidak, sakelar
    // "Pembayaran Online" akan terlihat mati sendiri setiap kali kredensial
    // gerbang belum diisi — padahal admin tidak pernah mematikannya.
    return this.svc.getPublicSettings(false);
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
    if (dto.shopCtaBarText !== undefined) {
      patch[SETTING_KEYS.shopCtaBarText] = dto.shopCtaBarText;
    }
    if (dto.siteTitle !== undefined) {
      patch[SETTING_KEYS.siteTitle] = dto.siteTitle;
    }
    if (dto.faviconUrl !== undefined) {
      patch[SETTING_KEYS.faviconUrl] = dto.faviconUrl;
    }
    if (dto.themeBrandColor !== undefined) {
      patch[SETTING_KEYS.themeBrandColor] = dto.themeBrandColor;
    }
    if (dto.themeSecondaryColor !== undefined) {
      patch[SETTING_KEYS.themeSecondaryColor] = dto.themeSecondaryColor;
    }
    for (const k of [
      'shippingMin',
      'shippingRateInstant',
      'shippingRateScheduled',
      'pointPerRupiah',
    ] as const) {
      if (dto[k] !== undefined) patch[SETTING_KEYS[k]] = String(dto[k]);
    }
    if (dto.chatLanguage !== undefined) {
      patch[SETTING_KEYS.chatLanguage] = dto.chatLanguage;
    }
    await this.svc.update(patch);
    return this.svc.getPublicSettings(false);
  }
}
