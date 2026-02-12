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

      let currentUser: User | null = null;

      // 1. Проверяем, существует ли уже пользователь
      const existingUser = await this.userRepository.findOne({
        where: { id: data.id },
      });

      if (existingUser) {
        this.logger.log(`User ${data.id} already exists. Updating info...`);
        existingUser.email = data.email;
        existingUser.username = data.username;
        currentUser = await this.userRepository.save(existingUser);
      } else {
        // 2. Если нет - пытаемся создать
        try {
          const newUser = this.userRepository.create({
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role || 'User',
          });
          currentUser = await this.userRepository.save(newUser);
          this.logger.log(`User ${data.id} created in Core DB.`);

          // Попытка создать профиль сразу
          try {
            await this.profilesService.createProfile(currentUser);
            this.logger.log(`Profile created for user ${data.id}.`);
          } catch (createError: any) {
            // Если профиль уже создан параллельным процессом — игнорируем
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (createError.code === '23505') {
              this.logger.warn(
                `Profile for user ${data.id} already exists (concurrent creation).`,
              );
            } else {
              throw createError;
            }
          }
        } catch (error: any) {
          // Ловим ошибку дубликата пользователя (23505)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (error.code === '23505') {
            this.logger.warn(
              `User ${data.id} was created concurrently. Skipping insert.`,
            );
            currentUser = await this.userRepository.findOne({
              where: { id: data.id },
            });
          } else {
            throw error;
          }
        }
      }

      // 3. Синхронизируем профиль (Self-healing logic v2)
      try {
        await this.updateProfileData(data);
      } catch (error: any) {
        // Если ловим 404 (профиль не найден при попытке обновления)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.status === 404 && currentUser) {
          this.logger.warn(
            `Profile not found for user ${data.id}. Attempting to re-create...`,
          );

          // Пытаемся создать профиль
          try {
            await this.profilesService.createProfile(currentUser);
          } catch (createError: any) {
            // ВОТ ЗДЕСЬ БЫЛА ОШИБКА
            // Если при попытке восстановления мы узнаем, что он всё-таки есть (23505)
            // Мы просто глотаем ошибку и идем обновлять данные
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (createError.code === '23505') {
              this.logger.warn(
                `Recovery creation failed: Profile actually exists. Proceeding to update.`,
              );
            } else {
              throw createError; // Если ошибка другая (например, валидация), пробрасываем
            }
          }

          // Повторная попытка обновления после восстановления
          await this.updateProfileData(data);
        } else {
          throw error;
        }
      }

      this.logger.log(`User ${data.id} sync completed successfully.`);
    } catch (error) {
      this.logger.error(`Error syncing user ${data.id}:`, error);
      // Не выбрасываем ошибку наружу, чтобы RabbitMQ не перепосылал сообщение бесконечно,
      // если ошибка неустранимая (хотя для prod лучше использовать Dead Letter Queue)
      // throw error;
    }
  }

  // Вынес логику маппинга в отдельный приватный метод для чистоты
  private async updateProfileData(data: UserSyncDto) {
    await this.profilesService.updateProfile(data.id, {
      displayName: data.displayName || data.username,
      bio: data.bio,
      birthDate: data.birthday ? new Date(data.birthday) : undefined,
    });
  }
}
