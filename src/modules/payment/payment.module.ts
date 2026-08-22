import { Module } from '@nestjs/common';
import { OrderModule } from '../order';
import { SettingModule } from '../setting';
import { PaymentController } from './payment.controller';
import { PaymentContract } from './payment.contract';
import { PaymentService } from './payment.service';
import { XenditService } from './xendit.service';

@Module({
  // Kredensial Xendit kini tinggal di modul Setting (tabel `settings`), bukan
  // di ConfigModule — supaya bisa diganti dari dashboard tanpa restart server.
  imports: [OrderModule, SettingModule],
  controllers: [PaymentController],
  providers: [
    XenditService,
    PaymentService,
    { provide: PaymentContract, useExisting: PaymentService },
  ],
  exports: [PaymentContract],
})
export class PaymentModule {}
