import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices'; // Import ClientProxy
import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NOTIFICATIONS_SERVICE } from '../constants/services'; // Import Token

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProfileFollow)
    private readonly followRepository: Repository<ProfileFollow>,
    // Inject RabbitMQ Client
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsClient: ClientProxy,
  ) {}

  async getMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        const newProfile = this.profileRepository.create({
          user: user,
          firstName: user.username,
          username: user.username,
          createdBy: userId,
          updatedBy: userId,
        });
        return await this.profileRepository.save(newProfile);
      }
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getProfileByUsername(username: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { username },
      relations: ['user'],
    });

    if (profile) return profile;

    throw new NotFoundException(`Profile with username ${username} not found`);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.getMyProfile(userId);

    if (dto.firstName) profile.firstName = dto.firstName;
    if (dto.lastName) profile.lastName = dto.lastName;
    if (dto.bio) profile.bio = dto.bio;
    if (dto.birthDate) profile.birthDate = new Date(dto.birthDate);
    if (dto.avatarUrl) profile.avatarUrl = dto.avatarUrl;

    profile.updatedBy = userId;

    return await this.profileRepository.save(profile);
  }

  async getProfileByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      return this.getMyProfile(userId);
    }
    return profile;
  }

  async followProfile(currentUserId: string, targetUsername: string) {
    const followerProfile = await this.getProfileByUserId(currentUserId);

    const targetProfile = await this.profileRepository.findOne({
      where: { username: targetUsername },
    });

    if (!targetProfile) {
      throw new NotFoundException(`User ${targetUsername} not found`);
    }

    if (followerProfile.id === targetProfile.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: targetProfile.id,
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Already following this user');
    }

    const follow = this.followRepository.create({
      follower: followerProfile,
      following: targetProfile,
    });

    await this.followRepository.save(follow);

    // --- SEND NOTIFICATION ---
    this.notificationsClient.emit('profile_followed', {
      actorId: currentUserId, // Кто подписался
      targetUserId: targetProfile.userId, // На кого (нужен userId, не profileId, обычно)
      timestamp: new Date(),
    });
    // -------------------------

    return { message: `You are now following ${targetUsername}` };
  }

  async unfollowProfile(currentUserId: string, targetUsername: string) {
    const followerProfile = await this.getProfileByUserId(currentUserId);

    const targetProfile = await this.profileRepository.findOne({
      where: { username: targetUsername },
    });

    if (!targetProfile) {
      throw new NotFoundException(`User ${targetUsername} not found`);
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: targetProfile.id,
      },
    });

    if (!follow) {
      throw new BadRequestException('You are not following this user');
    }

    await this.followRepository.remove(follow);

    return { message: `You have unfollowed ${targetUsername}` };
  }

  async getFollowers(username: string) {
    const targetProfile = await this.getProfileByUsername(username);

    const follows = await this.followRepository.find({
      where: { followingId: targetProfile.id },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => f.follower);
  }

  async getFollowing(username: string) {
    const targetProfile = await this.getProfileByUsername(username);

    const follows = await this.followRepository.find({
      where: { followerId: targetProfile.id },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => f.following);
  }
}
