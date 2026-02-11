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

  // Убрали async
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
    const message = await this.chatsService.sendMessage(
      payload.chatId,
      client.user.sub,
      payload.dto,
    );
    this.broadcastMessage(payload.chatId, message);
    return message;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  // Убрали async, так как emit синхронный (fire-and-forget)
  handleTyping(
    @MessageBody() data: { chatId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(data.chatId).emit('typing_status', {
      userId: client.user.sub,
      username: client.user.username,
      isTyping: data.isTyping,
      chatId: data.chatId,
    });
  }

  broadcastMessage(chatId: string, message: any) {
    this.server.to(chatId).emit('new_message', message);
  }
}
