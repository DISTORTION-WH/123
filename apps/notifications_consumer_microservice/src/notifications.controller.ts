import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

interface PostLikedEvent {
  actorId: string;
  targetUserId: string;
  postId: string;
  timestamp: string;
}

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  // Здесь можно инжектить MailerService или Repository для сохранения в БД
  // constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('post_liked')
  handlePostLiked(@Payload() data: PostLikedEvent) {
    this.logger.log(
      `[RabbitMQ] Event 'post_liked' received. User ${data.actorId} liked post ${data.postId} of user ${data.targetUserId}`,
    );

    // TODO:
    // 1. Сохранить уведомление в MongoDB (Notification Entity)
    // 2. Отправить Push-уведомление (через WebSocket, если пользователь онлайн)
    // 3. Отправить Email (опционально)
  }
}
