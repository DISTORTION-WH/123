import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { ProfilesService } from '../profiles/profiles.service';

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
  private readonly logger = new Logger(UsersService.name);

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
   * Метод синхронизации пользователя.
   * Должен быть идемпотентным (безопасным при повторном вызове).
   */
  async syncUser(data: UserSyncDto): Promise<void> {
    try {
      this.logger.log(`Syncing user ${data.id}...`);

      // 1. Проверяем, существует ли уже пользователь
      const existingUser = await this.userRepository.findOne({
        where: { id: data.id },
      });

      if (existingUser) {
        this.logger.log(`User ${data.id} already exists. Updating info...`);
        // Если пользователь есть, обновляем базовые поля (если нужно)
        existingUser.email = data.email;
        existingUser.username = data.username;
        await this.userRepository.save(existingUser);
      } else {
        // 2. Если нет - пытаемся создать
        try {
          const newUser = this.userRepository.create({
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role || 'User',
          });
          await this.userRepository.save(newUser);
          this.logger.log(`User ${data.id} created in Core DB.`);
        } catch (error: any) {
          // 2.1 Ловим ошибку дубликата (код 23505 в Postgres)
          // Это может случиться при состоянии гонки (Race Condition)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (error.code === '23505') {
            this.logger.warn(
              `User ${data.id} was created concurrently. Skipping insert.`,
            );
          } else {
            throw error; // Если ошибка другая - пробрасываем её дальше
          }
        }
      }

      // 3. Синхронизируем профиль (создаем или обновляем)
      // Важно делать это ПОСЛЕ того, как мы убедились, что User существует
      await this.profilesService.updateProfile(data.id, {
        displayName: data.displayName || data.username,
        bio: data.bio,
        birthDate: data.birthday ? new Date(data.birthday) : undefined,
      });

      this.logger.log(`User ${data.id} sync completed successfully.`);
    } catch (error) {
      this.logger.error(`Error syncing user ${data.id}:`, error);
      // Важно: если мы выбросим ошибку здесь, RabbitMQ может попытаться доставить сообщение снова.
      // Если ошибка критическая (например, БД упала) - throw нужен.
      // Если логическая - лучше залогировать и не ломать очередь.
      throw error;
    }
  }
}
