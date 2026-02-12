// apps/notifications_consumer_microservice/src/notifications.controller.ts

import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

interface PostLikedEvent {
  actorId: string;
  targetUserId: string;
  targetUserEmail?: string;
  postId: string;
  timestamp: string;
}

// Интерфейс для события комментария
interface CommentCreatedEvent {
  actorId: string;
  targetUserId: string;
  targetUserEmail: string;
  postId: string;
  commentId: string;
  type: 'COMMENT_ON_POST' | 'REPLY_TO_COMMENT';
  timestamp: string;
}

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('post_liked')
  handlePostLiked(@Payload() data: PostLikedEvent) {
    this.logger.log(
      `[RabbitMQ] Event 'post_liked' received. User ${data.actorId} liked post ${data.postId}`,
    );

    const email = data.targetUserEmail || 'test@example.com';

    this.notificationsService.sendLikeNotification(
      email,
      data.actorId,
      data.postId,
    );
  }

  // Добавляем обработчик для комментариев (раз мы их эмитим в CommentsService)
  @EventPattern('comment_created')
  handleCommentCreated(@Payload() data: CommentCreatedEvent) {
    this.logger.log(
      `[RabbitMQ] Event 'comment_created' received. Type: ${data.type}`,
    );

    // Здесь можно добавить вызов метода сервиса для отправки email о комментарии
    // this.notificationsService.sendCommentNotification(...)
  }
}
