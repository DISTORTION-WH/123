import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Chat, ChatType } from '../database/entities/chat.entity';
import { ChatParticipant } from '../database/entities/chat-participant.entity';
import { Message } from '../database/entities/message.entity';
import { MessageAsset } from '../database/entities/message-asset.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatsGateway } from './chats.gateway'; // IMPORT ADDED

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
    @Inject(forwardRef(() => ChatsGateway)) // INJECT GATEWAY
    private readonly chatsGateway: ChatsGateway,
  ) {}

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
      const savedChat = await queryRunner.manager.save(chat);

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

      await queryRunner.manager.save([part1, part2]);
      await queryRunner.commitTransaction();

      return savedChat;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserChats(userId: string) {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const participants = await this.participantsRepository.find({
      where: { profileId: profile.id },
      relations: [
        'chat',
        'chat.participants',
        'chat.participants.profile',
        'chat.messages',
      ],
      order: { chat: { updatedAt: 'DESC' } },
    });

    return participants.map((p) => {
      const chat = p.chat;
      const lastMessage = chat.messages?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      return {
        ...chat,
        lastMessage,
      };
    });
  }

  async getChatMessages(chatId: string, userId: string) {
    await this.validateParticipant(chatId, userId);

    return await this.messagesRepository.find({
      where: { chatId },
      relations: ['profile', 'assets', 'assets.asset', 'replyTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(chatId: string, userId: string, dto: SendMessageDto) {
    // 1. Валидация
    await this.validateParticipant(chatId, userId);
    const profile = await this.profilesService.getProfileByUserId(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let finalMessage: Message;

    try {
      // 2. Создание сообщения
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

      // 3. Получаем полное сообщение с релейшнами для возврата и рассылки
      finalMessage = await this.messagesRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['profile', 'assets', 'assets.asset'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // 4. 🔥 Рассылаем уведомление через сокеты 🔥
    // Важно: проверяем, что это не рекурсивный вызов из самого гейтвея (хотя broadcast безопасен)
    // Если сообщение пришло через REST Controller -> вызывается broadcast
    // Если через Gateway -> вызывается sendMessage -> вызывается broadcast
    // В обоих случаях все подписчики получат обновление.
    this.chatsGateway.broadcastMessage(chatId, finalMessage);

    return finalMessage;
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
}
