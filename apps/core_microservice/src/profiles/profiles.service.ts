import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { User } from '../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileFollow)
    private readonly followRepository: Repository<ProfileFollow>,
  ) {}

  async createProfile(user: User): Promise<Profile> {
    const profile = this.profileRepository.create({
      userId: user.id,
      username: user.username,
      displayName: user.username,
      createdBy: user.id,
    });
    return this.profileRepository.save(profile);
  }

  async getProfileByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { username },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    profile.avatarUrl = avatarUrl;
    return this.profileRepository.save(profile);
  }

  async followUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (myProfile.id === targetProfile.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followRepository.findOne({
      where: {
        followerId: myProfile.id,
        followingId: targetProfile.id,
      },
    });

    if (existing) {
      throw new ConflictException('Already following or request pending');
    }

    const follow = this.followRepository.create({
      followerId: myProfile.id,
      followingId: targetProfile.id,
      accepted: targetProfile.isPublic ? true : null,
      createdBy: userId,
    });

    return this.followRepository.save(follow);
  }

  async unfollowUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: myProfile.id,
        followingId: targetProfile.id,
      },
    });

    if (!follow) {
      throw new NotFoundException('Not following this user');
    }

    await this.followRepository.remove(follow);
    return { message: 'Unfollowed successfully' };
  }

  async removeFollower(userId: string, followerUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const followerProfile = await this.getProfileByUsername(followerUsername);

    if (!followerProfile) {
      throw new NotFoundException('Profile not found');
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: myProfile.id,
      },
    });

    if (!follow) {
      throw new NotFoundException('This user is not following you');
    }

    await this.followRepository.remove(follow);
    return { message: 'Follower removed' };
  }

  async getFollowers(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.followRepository.find({
      where: { followingId: profile.id, accepted: true },
      relations: ['follower'],
    });
  }

  async getFollowing(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.followRepository.find({
      where: { followerId: profile.id, accepted: true },
      relations: ['following'],
    });
  }

  async getFollowRequests(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.followRepository.find({
      where: { followingId: profile.id, accepted: null },
      relations: ['follower'],
    });
  }

  async acceptFollowRequest(userId: string, followerUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const followerProfile = await this.getProfileByUsername(followerUsername);

    if (!followerProfile) {
      throw new NotFoundException('Profile not found');
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: myProfile.id,
        accepted: null,
      },
    });

    if (!follow) {
      throw new NotFoundException('No pending follow request');
    }

    follow.accepted = true;
    follow.updatedBy = userId;
    return this.followRepository.save(follow);
  }

  async rejectFollowRequest(userId: string, followerUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const followerProfile = await this.getProfileByUsername(followerUsername);

    if (!followerProfile) {
      throw new NotFoundException('Profile not found');
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: followerProfile.id,
        followingId: myProfile.id,
        accepted: null,
      },
    });

    if (!follow) {
      throw new NotFoundException('No pending follow request');
    }

    await this.followRepository.remove(follow);
    return { message: 'Follow request rejected' };
  }

  async softDeleteProfile(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    profile.deleted = true;
    profile.updatedBy = userId;
    return this.profileRepository.save(profile);
  }

  async restoreProfile(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId, deleted: true },
    });

    if (!profile) {
      throw new NotFoundException('Deleted profile not found');
    }

    profile.deleted = false;
    profile.updatedBy = userId;
    return this.profileRepository.save(profile);
  }

  async getFollowersByUsername(username: string) {
    const profile = await this.getProfileByUsername(username);
    if (!profile) throw new NotFoundException('Profile not found');

    return this.followRepository.find({
      where: { followingId: profile.id, accepted: true },
      relations: ['follower'],
    });
  }

  async getFollowingByUsername(username: string) {
    const profile = await this.getProfileByUsername(username);
    if (!profile) throw new NotFoundException('Profile not found');

    return this.followRepository.find({
      where: { followerId: profile.id, accepted: true },
      relations: ['following'],
    });
  }
}
