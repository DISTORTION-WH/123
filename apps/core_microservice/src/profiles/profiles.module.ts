import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices'; // Import
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { UsersModule } from '../users/users.module';
import { NOTIFICATIONS_SERVICE } from '../constants/services'; // Убедись, что константа есть

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, ProfileFollow]),
    forwardRef(() => UsersModule),
    // Подключаем клиент для отправки уведомлений
    ClientsModule.register([
      {
        name: NOTIFICATIONS_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'notifications_queue',
          queueOptions: {
            durable: false,
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
