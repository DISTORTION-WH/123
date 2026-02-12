import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from '../constants/services';
import { ProfileBlock } from '../database/entities/profile-block.entity'; // <-- Важно
@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, ProfileFollow, ProfileBlock]),
    AuthModule,
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
