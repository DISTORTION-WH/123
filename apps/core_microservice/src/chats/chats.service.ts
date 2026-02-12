import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
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
import { EditMessageDto } from './dto/edit-message.dto'; // Импорт DTO

@Injectable()
export class ChatsService {
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
  ) {}

  // ... (методы createPrivateChat, createGroupChat, updateGroupChat, add/remove/leave/getUserChats остаются без изменений) ...

  // Я приведу только измененные/добавленные методы и те, что нужны для контекста

  // --- MESSAGES LOGIC ---

  async getChatMessages(chatId: string, userId: string) {
    await this.validateParticipant(chatId, userId);

    return await this.messagesRepository.find({
      where: { chatId },
      relations: ['profile', 'assets', 'assets.asset', 'replyTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    await this.validateParticipant(chatId, userId);
    const profile = await this.profilesService.getProfileByUserId(userId);

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
        relations: ['profile', 'assets', 'assets.asset', 'replyTo'], // Добавил replyTo
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Отправляем через сокет
    this.chatsGateway.broadcastMessage(chatId, finalMessage);

    return finalMessage;
  }

  async editMessage(messageId: string, userId: string, dto: EditMessageDto) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['profile'],
    });

    if (!message) throw new NotFoundException('Message not found');

    // Проверяем, что редактирует автор
    // Сравниваем profileId. Для этого нужно получить profileId текущего пользователя
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

    // Подгружаем связи для корректной отправки на фронт
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
      // Уже удалено, можно вернуть 200 или ошибку
      return { message: 'Message already deleted' };
    }

    // Soft delete согласно требованиям:
    // "Deleted messages are marked as deleted, shown within chat and have empty content."
    message.isDeleted = true;
    message.content = ''; // Очищаем контент
    message.updatedBy = userId;

    await this.messagesRepository.save(message);

    this.chatsGateway.broadcastMessageDeleted(message.chatId, messageId);

    return { message: 'Message deleted' };
  }

  // --- HELPERS (Дублирую, чтобы файл был валидным, если копируешь целиком) ---

  // ... (методы createPrivateChat и прочие вспомогательные остаются, но для краткости ответа я показал только новые методы сообщений.
  // В реальном файле весь код должен быть собран вместе).

  // Для компиляции, восстановим недостающие методы, так как ты просил полные листинги.
  // Ниже полный код Service с добавленными методами.

  // --- PRIVATE CHAT ---
  async createPrivateChat(currentUserId: string, targetUsername: string) {
    const me = await this.profilesService.getProfileByUserId(currentUserId);
    const target =
      await this.profilesService.getProfileByUsername(targetUsername);

    if (me.id === target.id) {
      throw new BadRequestException('Cannot chat with yourself');
    }

    const myChats = await this.participantsRepository.find({
      where: { profileId: me.id },
      relations: ['chat', 'chat.participants'],
    });

    const existingChat = myChats.find(
      (p) =>
        p.chat.type === ChatType.PRIVATE &&
        p.chat.participants.some((op) => op.profileId === target.id),
    );

    if (existingChat) {
      return existingChat.chat;
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
        createdBy: currentUserId,
      });
      const part2 = this.participantsRepository.create({
        chatId: savedChat.id,
        profileId: target.id,
        createdBy: currentUserId,
      });

      await queryRunner.manager.save(ChatParticipant, [part1, part2]);
      await queryRunner.commitTransaction();

      return savedChat;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- GROUP CHAT ---
  async createGroupChat(currentUserId: string, dto: CreateChatDto) {
    const me = await this.profilesService.getProfileByUserId(currentUserId);

    const participantsProfiles = [me];
    if (dto.participantUsernames && dto.participantUsernames.length > 0) {
      for (const username of dto.participantUsernames) {
        try {
          const profile =
            await this.profilesService.getProfileByUsername(username);
          if (!participantsProfiles.find((p) => p.id === profile.id)) {
            participantsProfiles.push(profile);
          }
        } catch {
          console.warn(`User ${username} not found, skipping`);
        }
      }
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

      return savedChat;
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
    if (dto.description) chat.description = dto.description;
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

    const result = await Promise.all(
      participants.map(async (p) => {
        const lastMessage = await this.messagesRepository.findOne({
          where: { chatId: p.chatId },
          order: { createdAt: 'DESC' },
          relations: ['profile'],
        });

        return {
          ...p.chat,
          lastMessage,
        };
      }),
    );

    return result;
  }

  public async validateParticipant(chatId: string, userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);
    const participant = await this.participantsRepository.findOne({
      where: { chatId, profileId: profile.id },
    });
    if (!participant) {
      throw new NotFoundException('Chat not found or you are not a member');
    }
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
