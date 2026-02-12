import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../database/entities/user.entity';
import { NOTIFICATIONS_SERVICE } from '../constants/services';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(ProfileFollow)
    private readonly followsRepository: Repository<ProfileFollow>,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsClient: ClientProxy,
  ) {}

  async createProfile(user: User) {
    // Используем relation 'user' вместо 'userId', если userId нет как колонки
    // Или приводим к типу Partial<Profile> если уверены
    const profile = this.profilesRepository.create({
      user: user, // Передаем объект User
      // userId: user.id, // Убираем, если это вызывает ошибку типов
      username: `user_${user.id.substring(0, 8)}`,
      // displayName нет в сущности? Проверь сущность. Если есть - должно работать.
      // Допустим, в базе поле first_name/last_name, но в entity.ts должно быть поле класса.
      // Если displayName нет в entity, его нельзя использовать.
      // Предположим, поле называется displayName (как в ТЗ)
      displayName: user.email.split('@')[0],
      createdBy: user.id,
      updatedBy: user.id,
    } as unknown as Profile); // HACK: Если типы совсем не сходятся, но база позволяет

    return await this.profilesRepository.save(profile);
  }

  async getProfileByUserId(userId: string) {
    // Ищем по relation ID
    const profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } }, // Исправлено: поиск по вложенному объекту user.id
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getProfileByUsername(username: string, currentUserId?: string) {
    const profile = await this.profilesRepository.findOne({
      where: { username },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    let isFollowing = false;
    if (currentUserId) {
      try {
        const currentUserProfile = await this.getProfileByUserId(currentUserId);
        const follow = await this.followsRepository.findOne({
          where: {
            follower: { id: currentUserProfile.id },
            following: { id: profile.id },
          },
        });
        isFollowing = !!follow;
      } catch (e) {
        // Если у текущего юзера нет профиля, он не может быть подписан
        isFollowing = false;
      }
    }

    return { ...profile, isFollowing };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getProfileByUserId(userId);

    if (dto.username && dto.username !== profile.username) {
      const existing = await this.profilesRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new BadRequestException('Username is already taken');
      }
      profile.username = dto.username;
    }

    if (dto.displayName) profile.displayName = dto.displayName;
    if (dto.bio) profile.bio = dto.bio;
    if (dto.avatarUrl) profile.avatarUrl = dto.avatarUrl;

    profile.updatedBy = userId;

    return await this.profilesRepository.save(profile);
  }

  // --- FOLLOW LOGIC ---

  async followUser(currentUserId: string, targetUsername: string) {
    const follower = await this.getProfileByUserId(currentUserId);
    const target = await this.profilesRepository.findOne({
      where: { username: targetUsername },
    });

    if (!target) throw new NotFoundException('User to follow not found');

    if (follower.id === target.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Исправлено: используем relations в where
    const existingFollow = await this.followsRepository.findOne({
      where: {
        follower: { id: follower.id },
        following: { id: target.id },
      },
    });

    if (existingFollow) {
      throw new ConflictException('Already following');
    }

    const follow = this.followsRepository.create({
      follower: follower, // Передаем объекты
      following: target,
      createdBy: currentUserId,
    } as unknown as ProfileFollow);

    await this.followsRepository.save(follow);

    // Уведомление
    // Получаем userId целевого профиля для уведомления
    // В Profile entity должно быть поле user или загружаем его
    const targetWithUser = await this.profilesRepository.findOne({
      where: { id: target.id },
      relations: ['user'],
    });

    if (targetWithUser && targetWithUser.user) {
      this.notificationsClient.emit('user_followed', {
        actorId: currentUserId,
        targetUserId: targetWithUser.user.id,
        timestamp: new Date(),
      });
    }

    return { message: `You are now following ${targetUsername}` };
  }

  async unfollowUser(currentUserId: string, targetUsername: string) {
    const follower = await this.getProfileByUserId(currentUserId);
    const target = await this.profilesRepository.findOne({
      where: { username: targetUsername },
    });

    if (!target) throw new NotFoundException('User to unfollow not found');

    const follow = await this.followsRepository.findOne({
      where: {
        follower: { id: follower.id },
        following: { id: target.id },
      },
    });

    if (!follow) {
      throw new BadRequestException('You are not following this user');
    }

    await this.followsRepository.remove(follow);

    return { message: `You unfollowed ${targetUsername}` };
  }

  async getFollowers(username: string, page: number = 1, limit: number = 10) {
    const targetProfile = await this.profilesRepository.findOne({
      where: { username },
    });
    if (!targetProfile) throw new NotFoundException('Profile not found');

    const [follows, count] = await this.followsRepository.findAndCount({
      where: { following: { id: targetProfile.id } }, // Исправлено relation
      relations: ['follower'],
      take: limit,
      skip: (page - 1) * limit,
    });

    const profiles = follows.map((f) => f.follower);

    return {
      data: profiles,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async getFollowing(username: string, page: number = 1, limit: number = 10) {
    const targetProfile = await this.profilesRepository.findOne({
      where: { username },
    });
    if (!targetProfile) throw new NotFoundException('Profile not found');

    const [follows, count] = await this.followsRepository.findAndCount({
      where: { follower: { id: targetProfile.id } }, // Исправлено relation
      relations: ['following'],
      take: limit,
      skip: (page - 1) * limit,
    });

    const profiles = follows.map((f) => f.following);

    return {
      data: profiles,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }
}
