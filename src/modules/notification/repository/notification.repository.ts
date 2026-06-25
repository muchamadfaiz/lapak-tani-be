import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type?: string;
  data?: Prisma.InputJsonValue;
}

/**
 * Pemilik data tabel `notifications`. Satu-satunya tempat yang boleh mengakses
 * `prisma.notification`.
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateNotificationData): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async createMany(rows: CreateNotificationData[]): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.notification.createMany({ data: rows });
  }

  findByUser(userId: string, limit = 20): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
