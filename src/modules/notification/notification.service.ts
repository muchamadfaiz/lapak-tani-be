import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserContract } from '../user';
import { NotificationRepository } from './repository/notification.repository';
import { NotificationContract, NotifyInput } from './notification.contract';

/**
 * Implementasi NotificationContract. notifyUser/notifyAdmins dipakai modul lain.
 * (FCM/WebSocket realtime belum — saat ini DB + polling dari FE.)
 */
@Injectable()
export class NotificationService extends NotificationContract {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly userContract: UserContract,
  ) {
    super();
  }

  async notifyUser(userId: string, input: NotifyInput): Promise<void> {
    await this.repo.create({
      userId,
      title: input.title,
      message: input.message,
      type: input.type,
      data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
    });
  }

  async notifyAdmins(input: NotifyInput): Promise<void> {
    const adminIds = await this.userContract.getAdminIds();
    await this.repo.createMany(
      adminIds.map((userId) => ({
        userId,
        title: input.title,
        message: input.message,
        type: input.type,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
      })),
    );
  }
}
