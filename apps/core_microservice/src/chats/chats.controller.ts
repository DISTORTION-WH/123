import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatType } from '../database/entities/chat.entity';
import { UpdateChatDto } from './dto/update-chat.dto';
import { AddParticipantDto } from './dto/add-participant.dto';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create private or group chat' })
  async createChat(
    @CurrentUser() user: CurrentUserType,
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
  async getMyChats(@CurrentUser() user: CurrentUserType) {
    return this.chatsService.getUserChats(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group chat info (Admin only)' })
  async updateChat(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateChatDto,
  ) {
    return this.chatsService.updateGroupChat(chatId, user.id, dto);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant to group (Admin only)' })
  async addParticipant(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatsService.addParticipant(chatId, user.id, dto.username);
  }

  @Delete(':id/participants/:profileId')
  @ApiOperation({ summary: 'Remove participant from group (Admin only)' })
  async removeParticipant(
    @Param('id') chatId: string,
    @Param('profileId') profileId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.chatsService.removeParticipant(chatId, user.id, profileId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave group chat' })
  async leaveChat(
    @Param('id') chatId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.chatsService.leaveChat(chatId, user.id);
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
