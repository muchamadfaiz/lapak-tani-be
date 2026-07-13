import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import paymentConfig from '../../config/payment.config';
import { OrderModule } from '../order';
import { SettingModule } from '../setting';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MidtransService } from './midtrans.service';

@Module({
  imports: [ConfigModule.forFeature(paymentConfig), OrderModule, SettingModule],
  controllers: [PaymentController],
  providers: [MidtransService, PaymentService],
})
export class PaymentModule {}
