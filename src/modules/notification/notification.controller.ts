import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ResponseMessage } from '../../common';
import {
  FindNotificationsUseCase,
  MarkReadUseCase,
  MarkAllReadUseCase,
} from './use-cases';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly findNotifications: FindNotificationsUseCase,
    private readonly markRead: MarkReadUseCase,
    private readonly markAllRead: MarkAllReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Notifikasi milik user + jumlah belum dibaca' })
  @ApiResponse({ status: 200, description: '{ items, unreadCount }' })
  @ResponseMessage('Success get notifications')
  findAll(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.findNotifications.execute(userId, limit ? Number(limit) : 20);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi sebagai dibaca' })
  @ResponseMessage('Success mark all read')
  readAll(@CurrentUser('id') userId: string) {
    return this.markAllRead.execute(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi sebagai dibaca' })
  @ResponseMessage('Success mark read')
  read(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.markRead.execute(id, userId);
  }
}
