import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repository/notification.repository';

@Injectable()
export class MarkReadUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.repo.markRead(id, userId);
  }
}

@Injectable()
export class MarkAllReadUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(userId: string): Promise<void> {
    await this.repo.markAllRead(userId);
  }
}
