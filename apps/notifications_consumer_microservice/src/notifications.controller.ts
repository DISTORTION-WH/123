import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

interface PostLikedEvent {
  actorId: string;
  targetUserId: string;
  targetUserEmail?: string; // Поле может быть опциональным
  postId: string;
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

    // Если email пришел в событии, используем его. Иначе - заглушка.
    const email = data.targetUserEmail || 'test@example.com';

    // Вызываем сервис (синхронно, так как убрали async в сервисе)
    this.notificationsService.sendLikeNotification(
      email,
      data.actorId, // Пока используем ID как имя, позже можно передавать actorName
      data.postId,
    );
  }
}
