import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../../common';
import waLoginConfig from '../../../config/wa-login.config';
import { WaLoginService } from './wa-login.service';

@ApiTags('WA Login')
@Controller('otp/wa-login')
export class WaLoginController {
  constructor(
    private readonly svc: WaLoginService,
    @Inject(waLoginConfig.KEY)
    private readonly cfg: ConfigType<typeof waLoginConfig>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('start')
  @ApiOperation({ summary: 'Mulai login instan WA → dapat kode + link wa.me' })
  @ResponseMessage('Success start WA login')
  start() {
    return this.svc.start();
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook pesan masuk WhatsApp (dipanggil Fonnte)' })
  webhook(
    @Query('token') token: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    // Secret cegah pemalsuan. URL webhook di Fonnte: .../webhook?token=SECRET
    if (this.cfg.webhookToken && token !== this.cfg.webhookToken) {
      throw new ForbiddenException('Invalid webhook token');
    }
    // Fonnte incoming: nama field bisa beda-beda → toleran.
    const sender = String(body.sender ?? body.from ?? body.pengirim ?? '');
    const message = String(body.message ?? body.text ?? body.pesan ?? '');
    return this.svc.handleIncoming(sender, message);
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Cek status sesi (polling). verified → token sesi-HP' })
  @ResponseMessage('Success get WA login status')
  status(@Query('code') code: string) {
    return this.svc.status(code);
  }
}
