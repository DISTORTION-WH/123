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

  async syncUser(data: UserSyncDto): Promise<void> {
    try {
      this.logger.log(`Syncing user ${data.id}...`);

      let currentUser: User | null = null;

      const existingUser = await this.userRepository.findOne({
        where: { id: data.id },
      });

      if (existingUser) {
        this.logger.log(`User ${data.id} already exists. Updating info...`);
        existingUser.email = data.email;
        existingUser.username = data.username;
        currentUser = await this.userRepository.save(existingUser);
      } else {
        try {
          const newUser = this.userRepository.create({
            id: data.id,
            email: data.email,
            username: data.username,
            role: data.role || 'User',
          });
          currentUser = await this.userRepository.save(newUser);
          this.logger.log(`User ${data.id} created in Core DB.`);

          try {
            await this.profilesService.createProfile(currentUser);
            this.logger.log(`Profile created for user ${data.id}.`);
          } catch (createError: unknown) {
            const dbErr = createError as { code?: string };
            if (dbErr.code === '23505') {
              this.logger.warn(
                `Profile for user ${data.id} already exists (concurrent creation).`,
              );
            } else {
              throw createError;
            }
          }
        } catch (error: unknown) {
          const dbErr = error as { code?: string };
          if (dbErr.code === '23505') {
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

      try {
        await this.updateProfileData(data);
      } catch (error: unknown) {
        const httpErr = error as { status?: number };
        if (httpErr.status === 404 && currentUser) {
          this.logger.warn(
            `Profile not found for user ${data.id}. Attempting to re-create...`,
          );

          try {
            await this.profilesService.createProfile(currentUser);
          } catch (createError: unknown) {
            const dbErr = createError as { code?: string };
            if (dbErr.code === '23505') {
              this.logger.warn(
                `Recovery creation failed: Profile actually exists. Proceeding to update.`,
              );
            } else {
              throw createError;
            }
          }

          await this.updateProfileData(data);
        } else {
          throw error;
        }
      }

      this.logger.log(`User ${data.id} sync completed successfully.`);
    } catch (error) {
      this.logger.error(`Error syncing user ${data.id}:`, error);
    }
  }

  private async updateProfileData(data: UserSyncDto) {
    await this.profilesService.updateProfile(data.id, {
      displayName: data.displayName || data.username,
      bio: data.bio,
      birthDate: data.birthday ? new Date(data.birthday) : undefined,
    });
  }
}
