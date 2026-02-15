import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { Chat } from '../database/entities/chat.entity';
import { ChatParticipant } from '../database/entities/chat-participant.entity';
import { Message } from '../database/entities/message.entity';
import { MessageAsset } from '../database/entities/message-asset.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MessageReaction } from '../database/entities/message-reaction.entity';
import { Post } from '../database/entities/post.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      ChatParticipant,
      Message,
      MessageAsset,
      MessageReaction,
      Post,
    ]),
    AuthModule,
    ProfilesModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway, WsJwtGuard],
  exports: [ChatsService],
})
export class ChatsModule {}
