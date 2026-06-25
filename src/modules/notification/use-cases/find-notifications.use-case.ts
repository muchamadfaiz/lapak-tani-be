import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repository/notification.repository';
import { NotificationListDto } from '../dto';

@Injectable()
export class FindNotificationsUseCase {
  constructor(private readonly repo: NotificationRepository) {}

  async execute(userId: string, limit = 20): Promise<NotificationListDto> {
    const [items, unreadCount] = await Promise.all([
      this.repo.findByUser(userId, limit),
      this.repo.countUnread(userId),
    ]);
    return {
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }
}
