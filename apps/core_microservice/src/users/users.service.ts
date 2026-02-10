import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ProfilesService } from '../profiles/profiles.service';

// Интерфейс для данных синхронизации
export interface UserSyncDto {
  id: string;
  email: string;
  username: string;
  role?: string;
  displayName?: string;
  birthday?: string;
  bio?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profilesService: ProfilesService,
  ) {}

  async getCurrentUser(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
  }

  /**
   * Метод синхронизации пользователя, вызываемый RabbitMQ консьюмером.
   * Создает пользователя и базовый профиль в Core базе данных.
   */
  async syncUser(data: UserSyncDto): Promise<void> {
    try {
      console.log(`[UsersService] Syncing user ${data.id}...`);

      // 1. Проверяем идемпотентность (не создан ли уже такой юзер)
      const existingUser = await this.userRepository.findOne({
        where: { id: data.id },
      });
      if (existingUser) {
        console.log(`[UsersService] User ${data.id} already exists. Skipping.`);
        return;
      }

      // 2. Создаем сущность User
      const newUser = this.userRepository.create({
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role || 'User',
      });

      await this.userRepository.save(newUser);

      // 3. Создаем профиль для пользователя
      // Используем метод updateProfile из ProfilesService, который создаст запись, если её нет
      await this.profilesService.updateProfile(newUser.id, {
        firstName: data.displayName || data.username,
        bio: data.bio,
        birthDate: data.birthday,
      });

      console.log(`[UsersService] User ${data.id} synced successfully.`);
    } catch (error) {
      console.error(`[UsersService] Error syncing user ${data.id}:`, error);
      throw error; // Бросаем ошибку, чтобы RabbitMQ (если настроен ack) мог повторить попытку
    }
  }
}
