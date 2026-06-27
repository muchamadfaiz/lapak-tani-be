import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import otpConfig from '../../config/otp.config';
import { OtpController } from './otp.controller';
import { OtpRepository } from './repository/otp.repository';
import { FonnteService } from './whatsapp/fonnte.service';
import { OtpContract } from './otp.contract';
import { OtpService } from './otp.service';

@Module({
  imports: [ConfigModule.forFeature(otpConfig), JwtModule.register({})],
  controllers: [OtpController],
  providers: [
    OtpRepository,
    FonnteService,
    { provide: OtpContract, useClass: OtpService },
  ],
  exports: [OtpContract],
})
export class OtpModule {}
