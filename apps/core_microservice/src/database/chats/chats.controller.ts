import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('private')
  @ApiOperation({ summary: 'Create or get existing private chat' })
  async createPrivateChat(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateChatDto,
  ) {
    // Для базовой версии поддерживаем только targetUsername для приватных чатов
    if (!dto.targetUsername) {
      throw new Error('Target username is required for private chat');
    }
    return this.chatsService.createPrivateChat(user.id, dto.targetUsername);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of my chats' })
  async getMyChats(@CurrentUser() user: CurrentUserType) {
    return this.chatsService.getUserChats(user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a chat' })
  async getMessages(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.chatsService.getChatMessages(chatId, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(chatId, user.id, dto);
  }
}
