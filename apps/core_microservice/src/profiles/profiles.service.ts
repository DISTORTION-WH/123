// apps/core_microservice/src/profiles/profiles.service.ts

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
import { ProfileBlock } from '../database/entities/profile-block.entity';
import { User } from '../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Like } from 'typeorm';
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileFollow)
    private readonly followRepository: Repository<ProfileFollow>,
    @InjectRepository(ProfileBlock)
    private readonly blockRepository: Repository<ProfileBlock>,
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
  async searchProfiles(query: string, currentUserId: string) {
    if (!query) return [];

    const profiles = await this.profileRepository.find({
      where: [
        { username: Like(`%${query}%`) },
        { displayName: Like(`%${query}%`) },
      ],
      take: 10,
    });

    // Обогащаем данными: подписан ли я на них?
    const results = await Promise.all(
      profiles.map(async (profile) => {
        const isFollowing = await this.followRepository.findOne({
          where: {
            followerId: (await this.getProfileByUserId(currentUserId)).id,
            followingId: profile.id,
            accepted: true,
          },
        });
        return { ...profile, isFollowing: !!isFollowing };
      }),
    );

    return results;
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

  // --- Follow Logic ---

  async followUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (myProfile.id === targetProfile.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if blocked
    const isBlocked = await this.checkIsBlocked(myProfile.id, targetProfile.id);
    if (isBlocked) {
      throw new BadRequestException(
        'You cannot follow this user (block active)',
      );
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

  // --- Block Logic ---

  async blockUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (myProfile.id === targetProfile.id) {
      throw new BadRequestException('You cannot block yourself');
    }

    const existingBlock = await this.blockRepository.findOne({
      where: {
        blockerId: myProfile.id,
        blockedId: targetProfile.id,
      },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    // Create block
    const block = this.blockRepository.create({
      blockerId: myProfile.id,
      blockedId: targetProfile.id,
    });

    await this.blockRepository.save(block);

    // Remove mutual follows/requests if exist (hard break of friendship)
    await this.followRepository.delete({
      followerId: myProfile.id,
      followingId: targetProfile.id,
    });

    await this.followRepository.delete({
      followerId: targetProfile.id,
      followingId: myProfile.id,
    });

    return { message: `User ${targetUsername} blocked` };
  }

  async unblockUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    const block = await this.blockRepository.findOne({
      where: {
        blockerId: myProfile.id,
        blockedId: targetProfile.id,
      },
    });

    if (!block) {
      throw new NotFoundException('User is not blocked');
    }

    await this.blockRepository.remove(block);
    return { message: `User ${targetUsername} unblocked` };
  }

  // --- Helpers for Checks ---

  /**
   * Checks if two profiles are friends (mutual follow with accepted=true)
   */
  async checkIsFriend(
    profileIdA: string,
    profileIdB: string,
  ): Promise<boolean> {
    const followAtoB = await this.followRepository.findOne({
      where: {
        followerId: profileIdA,
        followingId: profileIdB,
        accepted: true,
      },
    });

    const followBtoA = await this.followRepository.findOne({
      where: {
        followerId: profileIdB,
        followingId: profileIdA,
        accepted: true,
      },
    });

    return !!(followAtoB && followBtoA);
  }

  /**
   * Checks if ANY block exists between two profiles (A blocked B OR B blocked A)
   */
  async checkIsBlocked(
    profileIdA: string,
    profileIdB: string,
  ): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: [
        { blockerId: profileIdA, blockedId: profileIdB },
        { blockerId: profileIdB, blockedId: profileIdA },
      ],
    });
    return !!block;
  }

  // --- Soft Delete ---

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

  // --- Public Getters ---

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
