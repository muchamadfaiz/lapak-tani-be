import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import otpConfig from '../../config/otp.config';
import waLoginConfig from '../../config/wa-login.config';
import { OtpController } from './otp.controller';
import { OtpRepository } from './repository/otp.repository';
import { FonnteService } from './whatsapp/fonnte.service';
import { TwilioService } from './sms/twilio.service';
import { OtpContract } from './otp.contract';
import { OtpService } from './otp.service';
import { WaLoginController } from './wa-login/wa-login.controller';
import { WaLoginService } from './wa-login/wa-login.service';
import { WaLoginRepository } from './wa-login/wa-login.repository';

@Module({
  imports: [
    ConfigModule.forFeature(otpConfig),
    ConfigModule.forFeature(waLoginConfig),
    JwtModule.register({}),
  ],
  controllers: [OtpController, WaLoginController],
  providers: [
    OtpRepository,
    FonnteService,
    TwilioService,
    { provide: OtpContract, useClass: OtpService },
    WaLoginService,
    WaLoginRepository,
  ],
  exports: [OtpContract],
})
export class OtpModule {}
