import { Module } from '@nestjs/common';
import { UserModule } from '../user';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './repository/notification.repository';
import { NotificationContract } from './notification.contract';
import { NotificationService } from './notification.service';
import {
  FindNotificationsUseCase,
  MarkReadUseCase,
  MarkAllReadUseCase,
} from './use-cases';

@Module({
  imports: [UserModule], // butuh UserContract.getAdminIds()
  controllers: [NotificationController],
  providers: [
    NotificationRepository,
    { provide: NotificationContract, useClass: NotificationService },
    FindNotificationsUseCase,
    MarkReadUseCase,
    MarkAllReadUseCase,
  ],
  exports: [NotificationContract],
})
export class NotificationModule {}
