import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { PostLike } from '../database/entities/post-like.entity';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { User } from '../database/entities/user.entity';
import { NOTIFICATIONS_SERVICE } from '../constants/services';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module'; // <-- Импортируем модуль
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostAsset,
      PostLike,
      Profile,
      ProfileFollow,
      User,
    ]),
    ProfilesModule,
    AuthModule,
    ClientsModule.register([
      {
        name: NOTIFICATIONS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
          ],
          queue:
            process.env.RABBITMQ_NOTIFICATIONS_QUEUE || 'notifications_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
