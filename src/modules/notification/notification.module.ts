import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './repository/notification.repository';
import { NotificationContract } from './notification.contract';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import {
  FindNotificationsUseCase,
  MarkReadUseCase,
  MarkAllReadUseCase,
} from './use-cases';

@Module({
  imports: [UserModule, JwtModule.register({})], // UserContract + JwtService (gateway)
  controllers: [NotificationController],
  providers: [
    NotificationRepository,
    NotificationGateway,
    { provide: NotificationContract, useClass: NotificationService },
    FindNotificationsUseCase,
    MarkReadUseCase,
    MarkAllReadUseCase,
  ],
  exports: [NotificationContract],
})
export class NotificationModule {}
