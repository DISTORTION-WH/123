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
import { WsJwtGuard } from './guards/ws-jwt.guard'; // Проверь путь к гарду, возможно './guards/...'
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedSocket extends Socket {
  user: {
    sub: string;
    email: string;
    username: string;
  };
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.join(data.chatId);
    console.log(`User ${client.user.sub} joined chat ${data.chatId}`);
    return { event: 'joined_chat', data: { chatId: data.chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave(data.chatId);
    return { event: 'left_chat', data: { chatId: data.chatId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: { chatId: string; dto: SendMessageDto },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Мы просто вызываем сервис. Сервис сам вызовет broadcastMessage внутри.
    // Если здесь оставить this.broadcastMessage, будет дублирование сообщений.
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
    client.to(data.chatId).emit('typing_status', {
      userId: client.user.sub,
      username: client.user.username, // Убедись, что username есть в токене/request
      isTyping: data.isTyping,
      chatId: data.chatId,
    });
  }

  // --- PUBLIC METHODS FOR SERVICE ---

  /**
   * Отправка нового сообщения всем в комнате
   */
  broadcastMessage(chatId: string, message: any) {
    this.server.to(chatId).emit('new_message', message);
  }

  /**
   * Уведомление об изменении сообщения (редактирование)
   */
  broadcastMessageUpdated(chatId: string, message: any) {
    this.server.to(chatId).emit('message_updated', message);
  }

  /**
   * Уведомление об удалении сообщения
   */
  broadcastMessageDeleted(chatId: string, messageId: string) {
    this.server.to(chatId).emit('message_deleted', { id: messageId, chatId });
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
    // Клиент получит событие и сможет обновить конкретное сообщение локально,
    // не запрашивая весь список заново.
    this.server.to(`chat_${chatId}`).emit('reactionUpdated', payload);
  }
}
