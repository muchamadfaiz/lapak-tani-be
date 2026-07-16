import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import xenditConfig from '../../config/xendit.config';
import { OrderModule } from '../order';
import { SettingModule } from '../setting';
import { PaymentController } from './payment.controller';
import { PaymentContract } from './payment.contract';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';

@Module({
  imports: [ConfigModule.forFeature(xenditConfig), OrderModule, SettingModule],
  controllers: [PaymentController],
  providers: [
    XenditService,
    PaymentService,
    { provide: PaymentContract, useExisting: PaymentService },
  ],
  exports: [PaymentContract],
})
export class PaymentModule {}
