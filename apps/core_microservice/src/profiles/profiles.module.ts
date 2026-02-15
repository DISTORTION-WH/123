// apps/core_microservice/src/profiles/profiles.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { ProfileBlock } from '../database/entities/profile-block.entity';
import { Chat } from '../database/entities/chat.entity';
import { ChatParticipant } from '../database/entities/chat-participant.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      ProfileFollow,
      ProfileBlock,
      Chat,
      ChatParticipant,
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
