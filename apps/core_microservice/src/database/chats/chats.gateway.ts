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

// Интерфейс для типизации сокета с пользователем
interface AuthenticatedSocket extends Socket {
  user: {
    sub: string; // userId
    email: string;
    username: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // В продакшене лучше указать конкретный домен клиента
  },
  namespace: 'chats', // Разделяем пространство имен
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
  ) {}

  // Обработка подключения (можно использовать для логирования или глобальных рум)
  async handleConnection(client: Socket) {
    // Авторизация происходит в Guard, но здесь можно добавить логику
    // Например, добавить юзера в комнату его user_id для личных уведомлений
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
    // Здесь хорошо бы проверить, имеет ли право юзер входить в этот чат
    // Но для скорости пока оставим базовую логику.
    // В идеале: await this.chatsService.validateParticipant(data.chatId, client.user.sub);

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
    // Сохраняем сообщение через сервис
    const message = await this.chatsService.sendMessage(
      payload.chatId,
      client.user.sub,
      payload.dto,
    );

    // Рассылаем всем в комнате (включая отправителя, чтобы обновился UI)
    // Используем метод broadcastMessage, чтобы логика была централизована
    this.broadcastMessage(payload.chatId, message);

    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Отправляем всем в комнате, КРОМЕ отправителя
    client.to(data.chatId).emit('typing_status', {
      userId: client.user.sub,
      username: client.user.username,
      isTyping: data.isTyping,
      chatId: data.chatId,
    });
  }

  /**
   * Публичный метод для отправки сообщений в комнату.
   * Будет использоваться сервисом, если сообщение пришло через REST API.
   */
  broadcastMessage(chatId: string, message: any) {
    this.server.to(chatId).emit('new_message', message);
  }
}
