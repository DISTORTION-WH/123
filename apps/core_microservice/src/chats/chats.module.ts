import { Module } from '@nestjs/common'; // Убрали forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatParticipant, Message, MessageAsset]),
    AuthModule,
    ProfilesModule,
    ConfigModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway, WsJwtGuard],
  exports: [ChatsService],
})
export class ChatsModule {}
