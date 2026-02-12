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
    const profile = this.profilesRepository.create({
      user: user,
      username: `user_${user.id.substring(0, 8)}`,
      displayName: user.email.split('@')[0],
      createdBy: user.id,
      updatedBy: user.id,
    }); // Теперь TypeScript должен пропустить это без 'as unknown'

    return await this.profilesRepository.save(profile);
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.profilesRepository.findOne({
      where: { user: { id: userId } },
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
      } catch {
        // Убрали (e), теперь линтер не будет ругаться
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

    // Теперь это поле существует в Entity
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
      follower: follower,
      following: target,
      createdBy: currentUserId,
    } as unknown as ProfileFollow);

    await this.followsRepository.save(follow);

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
      where: { following: { id: targetProfile.id } },
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
      where: { follower: { id: targetProfile.id } },
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
