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
  private readonly logger = new Logger(NotificationsController.name); // Initialize the logger with the context of the current class

  constructor(private readonly notificationsService: NotificationsService) {}
  // Subscribe to a message with the 'post_liked' pattern from the RabbitMQ queue
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
  // Subscribe to a message with the 'comment_created' pattern
  @EventPattern('comment_created')
  handleCommentCreated(@Payload() data: CommentCreatedEvent) {
    this.logger.log(
      `[RabbitMQ] Event 'comment_created' received. Type: ${data.type}`,
    );
  }
}
