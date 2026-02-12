import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from '../database/entities/comment.entity';
import { CommentLike } from '../database/entities/comment-like.entity'; // 1. Импортируем сущность
import { Post } from '../database/entities/post.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from '../constants/services';

@Module({
  imports: [
    // 2. Регистрируем сущности, репозитории которых используются в CommentsService
    // Было: [Comment, Post] (или похожее)
    // Стало: Добавили CommentLike
    TypeOrmModule.forFeature([Comment, CommentLike, Post]),

    ProfilesModule,
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
  exports: [CommentsService], // Экспортируем, если он понадобится в других модулях
})
export class CommentsModule {}
