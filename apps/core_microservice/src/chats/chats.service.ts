// apps/core_microservice/src/chats/chats.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Chat, ChatType } from '../database/entities/chat.entity';
import {
  ChatParticipant,
  ChatRole,
} from '../database/entities/chat-participant.entity';
import { Message } from '../database/entities/message.entity';
import { MessageAsset } from '../database/entities/message-asset.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatsGateway } from './chats.gateway';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { MessageReaction } from '../database/entities/message-reaction.entity';
@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    @InjectRepository(Chat) private chatsRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private participantsRepository: Repository<ChatParticipant>,
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
    @InjectRepository(MessageAsset)
    private messageAssetsRepository: Repository<MessageAsset>,
    private profilesService: ProfilesService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    @InjectRepository(MessageReaction)
    private reactionsRepository: Repository<MessageReaction>,
  ) {}

  // --- CHAT MANAGEMENT ---

  async createPrivateChat(currentUserId: string, targetUsername: string) {
    const me = await this.profilesService.getProfileByUserId(currentUserId);
    const target =
      await this.profilesService.getProfileByUsername(targetUsername);

    if (me.id === target.id) {
      throw new BadRequestException('Cannot chat with yourself');
    }

    // --- REQUIREMENT: Check mutual follow (Friendship) ---
    const isFriend = await this.profilesService.checkIsFriend(me.id, target.id);
    if (!isFriend) {
      throw new ForbiddenException(
        'You can only start a chat with friends (mutual follow)',
      );
    }

    // Check if blocked
    const isBlocked = await this.profilesService.checkIsBlocked(
      me.id,
      target.id,
    );
    if (isBlocked) {
      throw new ForbiddenException('Cannot start chat: blocked user');
    }

    const existingChatId = await this.chatsRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'p1')
      .innerJoin('chat.participants', 'p2')
      .where('chat.type = :type', { type: ChatType.PRIVATE })
      .andWhere('p1.profileId = :meId', { meId: me.id })
      .andWhere('p2.profileId = :targetId', { targetId: target.id })
      .select('chat.id')
      .getOne();

    if (existingChatId) {
      return this.chatsRepository.findOne({
        where: { id: existingChatId.id },
        relations: ['participants', 'participants.profile'],
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chat = this.chatsRepository.create({
        type: ChatType.PRIVATE,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      });
      const savedChat = await queryRunner.manager.save(Chat, chat);

      const part1 = this.participantsRepository.create({
        chatId: savedChat.id,
        profileId: me.id,
        role: ChatRole.MEMBER,
        createdBy: currentUserId,
      });
      const part2 = this.participantsRepository.create({
        chatId: savedChat.id,
        profileId: target.id,
        role: ChatRole.MEMBER,
        createdBy: currentUserId,
      });

      await queryRunner.manager.save(ChatParticipant, [part1, part2]);
      await queryRunner.commitTransaction();

      return this.chatsRepository.findOne({
        where: { id: savedChat.id },
        relations: ['participants', 'participants.profile'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createGroupChat(currentUserId: string, dto: CreateChatDto) {
    const me = await this.profilesService.getProfileByUserId(currentUserId);
    const participantsProfiles = [me];

    if (dto.participantUsernames && dto.participantUsernames.length > 0) {
      const promises = dto.participantUsernames.map(async (username) => {
        try {
          return await this.profilesService.getProfileByUsername(username);
        } catch {
          this.logger.warn(`User ${username} not found during chat creation`);
          return null;
        }
      });

      const results = await Promise.all(promises);
      results.forEach((profile) => {
        if (profile && !participantsProfiles.find((p) => p.id === profile.id)) {
          participantsProfiles.push(profile);
        }
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chat = this.chatsRepository.create({
        type: ChatType.GROUP,
        name: dto.name || 'New Group',
        description: '',
        createdBy: currentUserId,
        updatedBy: currentUserId,
      });
      const savedChat = await queryRunner.manager.save(Chat, chat);

      const participantsEntities = participantsProfiles.map((profile) => {
        return this.participantsRepository.create({
          chatId: savedChat.id,
          profileId: profile.id,
          role: profile.id === me.id ? ChatRole.ADMIN : ChatRole.MEMBER,
          createdBy: currentUserId,
        });
      });

      await queryRunner.manager.save(ChatParticipant, participantsEntities);
      await queryRunner.commitTransaction();

      return this.chatsRepository.findOne({
        where: { id: savedChat.id },
        relations: ['participants', 'participants.profile'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateGroupChat(chatId: string, userId: string, dto: UpdateChatDto) {
    await this.validateAdmin(chatId, userId);

    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== ChatType.GROUP)
      throw new BadRequestException('Not a group chat');

    if (dto.name) chat.name = dto.name;
    if (dto.description !== undefined) chat.description = dto.description;
    chat.updatedBy = userId;

    return await this.chatsRepository.save(chat);
  }

  async addParticipant(
    chatId: string,
    currentUserId: string,
    targetUsername: string,
  ) {
    await this.validateAdmin(chatId, currentUserId);
    const targetProfile =
      await this.profilesService.getProfileByUsername(targetUsername);

    // Optional: Check block status before adding
    const me = await this.profilesService.getProfileByUserId(currentUserId);
    const isBlocked = await this.profilesService.checkIsBlocked(
      me.id,
      targetProfile.id,
    );
    if (isBlocked) {
      throw new ForbiddenException('Cannot add blocked user');
    }

    const existing = await this.participantsRepository.findOne({
      where: { chatId, profileId: targetProfile.id },
    });

    if (existing) throw new BadRequestException('User already in chat');

    const participant = this.participantsRepository.create({
      chatId,
      profileId: targetProfile.id,
      role: ChatRole.MEMBER,
      createdBy: currentUserId,
    });

    const saved = await this.participantsRepository.save(participant);
    return saved;
  }

  async removeParticipant(
    chatId: string,
    currentUserId: string,
    targetProfileId: string,
  ) {
    await this.validateAdmin(chatId, currentUserId);

    const participant = await this.participantsRepository.findOne({
      where: { chatId, profileId: targetProfileId },
    });

    if (!participant) throw new NotFoundException('Participant not found');

    const me = await this.profilesService.getProfileByUserId(currentUserId);
    if (participant.profileId === me.id) {
      throw new BadRequestException('Use leave endpoint to exit chat');
    }

    await this.participantsRepository.remove(participant);
    return { message: 'User removed from chat' };
  }

  async leaveChat(chatId: string, userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const participant = await this.participantsRepository.findOne({
      where: { chatId, profileId: profile.id },
      relations: ['chat'],
    });

    if (!participant) throw new NotFoundException('You are not in this chat');

    if (participant.chat.type === ChatType.PRIVATE) {
      throw new BadRequestException('Cannot leave private chat');
    }

    if (participant.role === ChatRole.ADMIN) {
      const otherParticipants = await this.participantsRepository
        .createQueryBuilder('p')
        .where('p.chatId = :chatId', { chatId })
        .andWhere('p.profileId != :myId', { myId: profile.id })
        .getMany();

      if (otherParticipants.length === 0) {
        await this.chatsRepository.delete(chatId);
        return { message: 'Chat deleted as last member left' };
      }

      const newAdmin = otherParticipants[0];
      newAdmin.role = ChatRole.ADMIN;
      await this.participantsRepository.save(newAdmin);
    }

    await this.participantsRepository.remove(participant);
    return { message: 'You left the chat' };
  }

  async getUserChats(userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const participants = await this.participantsRepository.find({
      where: { profileId: profile.id },
      relations: ['chat', 'chat.participants', 'chat.participants.profile'],
      order: { chat: { updatedAt: 'DESC' } },
    });

    const chats = participants.map((p) => p.chat);

    // --- REQUIREMENT: Primitive Blocking (Don't show if blocked) ---
    // We need to filter out private chats where the other user is blocked/blocker
    const validChats = [];

    for (const chat of chats) {
      if (chat.type === ChatType.PRIVATE) {
        const otherParticipant = chat.participants.find(
          (p) => p.profileId !== profile.id,
        );
        if (otherParticipant) {
          const isBlocked = await this.profilesService.checkIsBlocked(
            profile.id,
            otherParticipant.profileId,
          );
          if (isBlocked) {
            continue; // Skip this chat (Hidden)
          }
        }
      }
      validChats.push(chat);
    }

    const result = await Promise.all(
      validChats.map(async (chat) => {
        const lastMessage = await this.messagesRepository.findOne({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          where: { chatId: chat.id },
          order: { createdAt: 'DESC' },
          relations: ['profile'],
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...chat,
          lastMessage,
        };
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  // --- MESSAGES LOGIC ---

  async getChatMessages(chatId: string, userId: string) {
    await this.validateParticipant(chatId, userId);

    // Check if blocked logic also applies to fetching messages?
    // Usually if chat is hidden in list, user shouldn't access messages either.
    const profile = await this.profilesService.getProfileByUserId(userId);
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });

    if (chat.type === ChatType.PRIVATE) {
      const otherParticipant = chat.participants.find(
        (p) => p.profileId !== profile.id,
      );
      if (otherParticipant) {
        const isBlocked = await this.profilesService.checkIsBlocked(
          profile.id,
          otherParticipant.profileId,
        );
        if (isBlocked) {
          // If blocked, return empty or throw forbidden. Requirement says "just don't show"
          return [];
        }
      }
    }

    return await this.messagesRepository.find({
      where: { chatId },
      relations: ['profile', 'assets', 'assets.asset', 'replyTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    await this.validateParticipant(chatId, userId);
    const profile = await this.profilesService.getProfileByUserId(userId);

    // Extra check: If blocked, you can't send message (even if you somehow have the ID)
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });
    if (chat.type === ChatType.PRIVATE) {
      const otherParticipant = chat.participants.find(
        (p) => p.profileId !== profile.id,
      );
      if (otherParticipant) {
        const isBlocked = await this.profilesService.checkIsBlocked(
          profile.id,
          otherParticipant.profileId,
        );
        if (isBlocked) {
          throw new ForbiddenException('Cannot send message: blocked');
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let finalMessage: Message;

    try {
      const message = this.messagesRepository.create({
        chatId,
        profileId: profile.id,
        content: dto.content,
        replyToMessageId: dto.replyToMessageId,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedMessage = await queryRunner.manager.save(Message, message);

      if (dto.fileIds && dto.fileIds.length > 0) {
        const assets = dto.fileIds.map((assetId, index) =>
          this.messageAssetsRepository.create({
            messageId: savedMessage.id,
            assetId,
            orderIndex: index,
            createdBy: userId,
          }),
        );
        await queryRunner.manager.save(MessageAsset, assets);
      }

      await queryRunner.manager.update(Chat, chatId, { updatedAt: new Date() });

      await queryRunner.commitTransaction();

      finalMessage = await this.messagesRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['profile', 'assets', 'assets.asset', 'replyTo'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    if (finalMessage) {
      this.chatsGateway.broadcastMessage(chatId, finalMessage);
    }

    return finalMessage;
  }

  async editMessage(messageId: string, userId: string, dto: EditMessageDto) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['profile'],
    });

    if (!message) throw new NotFoundException('Message not found');

    const userProfile = await this.profilesService.getProfileByUserId(userId);

    if (message.profileId !== userProfile.id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    message.content = dto.content;
    message.isEdited = true;
    message.updatedBy = userId;

    const savedMessage = await this.messagesRepository.save(message);

    const fullMessage = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['profile', 'assets', 'assets.asset', 'replyTo'],
    });

    this.chatsGateway.broadcastMessageUpdated(message.chatId, fullMessage);

    return fullMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');

    const userProfile = await this.profilesService.getProfileByUserId(userId);

    if (message.profileId !== userProfile.id) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.isDeleted) {
      return { message: 'Message already deleted' };
    }

    message.isDeleted = true;
    message.content = '';
    message.updatedBy = userId;

    await this.messagesRepository.save(message);

    this.chatsGateway.broadcastMessageDeleted(message.chatId, messageId);

    return { message: 'Message deleted' };
  }

  // --- HELPERS ---

  public async validateParticipant(chatId: string, userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);
    const participant = await this.participantsRepository.findOne({
      where: { chatId, profileId: profile.id },
    });
    if (!participant) {
      throw new NotFoundException('Chat not found or you are not a member');
    }
  }
  async toggleReaction(messageId: string, userId: string, reaction: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Проверяем доступ к чату
    await this.validateParticipant(message.chatId, userId);

    const profile = await this.profilesService.getProfileByUserId(userId);

    const existingReaction = await this.reactionsRepository.findOne({
      where: {
        messageId: messageId,
        profileId: profile.id,
      },
    });

    let action: 'added' | 'removed' | 'updated';

    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        // Если та же эмодзи — удаляем (toggle off)
        await this.reactionsRepository.remove(existingReaction);
        action = 'removed';
      } else {
        // Если другая — обновляем
        existingReaction.reaction = reaction;
        await this.reactionsRepository.save(existingReaction);
        action = 'updated';
      }
    } else {
      // Если нет — создаем
      const newReaction = this.reactionsRepository.create({
        messageId,
        profileId: profile.id,
        reaction,
      });
      await this.reactionsRepository.save(newReaction);
      action = 'added';
    }

    // Отправляем событие в WebSocket

    this.chatsGateway.broadcastReactionUpdate(message.chatId, {
      messageId,
      profileId: profile.id,
      reaction: action === 'removed' ? null : reaction,
      action,
    });

    return { status: 'success', action };
  }
  private async validateAdmin(chatId: string, userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);
    const participant = await this.participantsRepository.findOne({
      where: { chatId, profileId: profile.id },
    });

    if (!participant) throw new NotFoundException('Chat not found');
    if (participant.role !== ChatRole.ADMIN) {
      throw new ForbiddenException('Only admin can perform this action');
    }
  }
}
