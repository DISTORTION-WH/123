import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { NOTIFICATIONS_SERVICE } from '../constants/services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, User, ProfileFollow]),
    // Регистрация RabbitMQ клиента
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
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
