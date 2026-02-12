import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import {
  CurrentUser,
  CurrentUserData, // Импортируем интерфейс, а не делаем алиас на декоратор
} from '../decorators/current-user.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatType } from '../database/entities/chat.entity';
import { UpdateChatDto } from './dto/update-chat.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { EditMessageDto } from './dto/edit-message.dto';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create private or group chat' })
  async createChat(
    @CurrentUser() user: CurrentUserData, // Используем правильный тип
    @Body() dto: CreateChatDto,
  ) {
    if (dto.type === ChatType.GROUP) {
      return this.chatsService.createGroupChat(user.id, dto);
    }
    // Default to private
    if (!dto.targetUsername) {
      throw new Error('Target username is required for private chat');
    }
    return this.chatsService.createPrivateChat(user.id, dto.targetUsername);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of my chats' })
  async getMyChats(@CurrentUser() user: CurrentUserData) {
    return this.chatsService.getUserChats(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group chat info (Admin only)' })
  async updateChat(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateChatDto,
  ) {
    return this.chatsService.updateGroupChat(chatId, user.id, dto);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant to group (Admin only)' })
  async addParticipant(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatsService.addParticipant(chatId, user.id, dto.username);
  }

  @Delete(':id/participants/:profileId')
  @ApiOperation({ summary: 'Remove participant from group (Admin only)' })
  async removeParticipant(
    @Param('id') chatId: string,
    @Param('profileId') profileId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatsService.removeParticipant(chatId, user.id, profileId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave group chat' })
  async leaveChat(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatsService.leaveChat(chatId, user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a chat' })
  async getMessages(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatsService.getChatMessages(chatId, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(chatId, user.id, dto);
  }

  // --- Новые эндпоинты ---

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  async editMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: EditMessageDto,
  ) {
    return this.chatsService.editMessage(messageId, user.id, dto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.chatsService.deleteMessage(messageId, user.id);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':chatId/read')
  @ApiOperation({ summary: 'Mark all messages in chat as read' })
  async markChatAsRead(
    @CurrentUser() user: CurrentUserData,
    @Param('chatId') chatId: string,
  ) {
    return await this.chatsService.markChatAsRead(chatId, user.id);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Toggle reaction on a message' })
  async toggleReaction(
    @CurrentUser() user: CurrentUserData,
    @Param('messageId') messageId: string,
    @Body() dto: ToggleReactionDto,
  ) {
    return await this.chatsService.toggleReaction(
      messageId,
      user.id,
      dto.reaction,
    );
  }
}
