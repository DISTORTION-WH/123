import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from '../database/entities/comment.entity';
import { CommentLike } from '../database/entities/comment-like.entity';
import { Post } from '../database/entities/post.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from '../constants/services';
import { AuthModule } from '../auth/auth.module'; // 1. Импортируем AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentLike, Post]),
    ProfilesModule,
    AuthModule, // 2. Добавляем в imports
    ClientsModule.register([
      {
        name: NOTIFICATIONS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'notifications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
