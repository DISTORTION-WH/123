// apps/core_microservice/src/chats/chats.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';

// Описываем структуру данных пользователя
interface ChatUser {
  sub: string;
  email?: string;
  username: string;
  id: string; // Добавлено, так как используется в коде
}

// Расширяем стандартный сокет
interface AuthenticatedSocket extends Socket {
  // Стандартное место хранения данных в Socket.IO v4
  data: {
    user?: ChatUser;
  };
  // Твой кастомный проперти (легаси)
  user: ChatUser;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  broadcastMessagesRead(
    chatId: string,
    payload: { profileId: string; messageIds: string[] },
  ) {
    this.server.to(`chat_${chatId}`).emit('messagesRead', payload);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typingStart')
  handleTypingStart(
    @MessageBody() data: { chatId: string },
    // Используем AuthenticatedSocket вместо Socket для типизации
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Теперь client.data.user типизирован, и линтер не будет ругаться
    client.broadcast.to(`chat_${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      userId: client.data.user?.id,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typingStop')
  handleTypingStop(
    @MessageBody() data: { chatId: string },
    // Используем AuthenticatedSocket вместо Socket
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.broadcast.to(`chat_${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      userId: client.data.user?.id,
      isTyping: false,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.join(`chat_${data.chatId}`); // Исправлено: лучше добавлять префикс, чтобы не было коллизий
    console.log(`User ${client.user.sub} joined chat ${data.chatId}`);
    return { event: 'joined_chat', data: { chatId: data.chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave(`chat_${data.chatId}`); // Исправлено: префикс
    return { event: 'left_chat', data: { chatId: data.chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: { chatId: string; dto: SendMessageDto },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const message = await this.chatsService.sendMessage(
      payload.chatId,
      client.user.sub,
      payload.dto,
    );
    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // client.to(...) отправляет всем кроме отправителя
    client.to(`chat_${data.chatId}`).emit('typing_status', {
      userId: client.user.sub,
      username: client.user.username,
      isTyping: data.isTyping,
      chatId: data.chatId,
    });
  }

  // --- PUBLIC METHODS FOR SERVICE ---

  broadcastMessage(chatId: string, message: any) {
    this.server.to(`chat_${chatId}`).emit('new_message', message);
  }

  broadcastMessageUpdated(chatId: string, message: any) {
    this.server.to(`chat_${chatId}`).emit('message_updated', message);
  }

  broadcastMessageDeleted(chatId: string, messageId: string) {
    this.server
      .to(`chat_${chatId}`)
      .emit('message_deleted', { id: messageId, chatId });
  }

  broadcastReactionUpdate(
    chatId: string,
    payload: {
      messageId: string;
      profileId: string;
      reaction: string | null;
      action: 'added' | 'removed' | 'updated';
    },
  ) {
    this.server.to(`chat_${chatId}`).emit('reactionUpdated', payload);
  }
}
