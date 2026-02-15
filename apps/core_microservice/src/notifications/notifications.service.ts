import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(params: {
    type: NotificationType;
    title: string;
    message: string;
    targetUserId: string;
    createdBy: string;
    data?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type: params.type,
      title: params.title,
      message: params.message,
      targetUserId: params.targetUserId,
      createdBy: params.createdBy,
      data: params.data || {},
    });
    return this.notificationRepository.save(notification);
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, targetUserId: userId },
    });
    if (!notification) return null;

    notification.isRead = true;
    notification.readAt = new Date();
    notification.updatedBy = userId;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { targetUserId: userId, isRead: false },
      { isRead: true, readAt: new Date(), updatedBy: userId },
    );
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { targetUserId: userId, isRead: false },
    });
  }
}
