import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { ProfileBlock } from '../database/entities/profile-block.entity';
import { Chat, ChatType } from '../database/entities/chat.entity';
import {
  ChatParticipant,
  ChatRole,
} from '../database/entities/chat-participant.entity';
import { User } from '../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileFollow)
    private readonly followRepository: Repository<ProfileFollow>,
    @InjectRepository(ProfileBlock)
    private readonly blockRepository: Repository<ProfileBlock>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
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
    if (!query || !query.trim()) return [];

    const currentUserProfile = await this.getProfileByUserId(currentUserId);

    const lowerQuery = query.toLowerCase();
    const profiles = await this.profileRepository.find({
      where: [
        { username: Like(`%${query}%`) },
        { displayName: Like(`%${query}%`) },
        { bio: Like(`%${query}%`) },
      ],
      take: 20,
    });

    const filtered = profiles.filter(
      (p) =>
        p.userId !== currentUserId &&
        (p.username.toLowerCase().includes(lowerQuery) ||
          (p.displayName && p.displayName.toLowerCase().includes(lowerQuery)) ||
          (p.bio && p.bio.toLowerCase().includes(lowerQuery))),
    );

    const results = await Promise.all(
      filtered.map(async (profile) => {
        const isFollowing = await this.followRepository.findOne({
          where: {
            followerId: currentUserProfile.id,
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

  async followUser(userId: string, targetUsername: string) {
    const myProfile = await this.getProfileByUserId(userId);
    const targetProfile = await this.getProfileByUsername(targetUsername);

    if (!targetProfile) {
      throw new NotFoundException('Profile not found');
    }

    if (myProfile.id === targetProfile.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const isBlocked = await this.checkIsBlocked(myProfile.id, targetProfile.id);
    if (isBlocked) {
      throw new BadRequestException('You cannot follow this user');
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

    const savedFollow = await this.followRepository.save(follow);

    if (savedFollow.accepted === true) {
      void this.notificationsService.create({
        type: NotificationType.FOLLOW,
        title: 'New follower',
        message: `@${myProfile.username} started following you`,
        targetUserId: targetProfile.userId,
        createdBy: userId,
        data: {
          actorName: myProfile.displayName || myProfile.username,
          actorUsername: myProfile.username,
          actorAvatar: myProfile.avatarUrl,
          link: `/profile/${myProfile.username}`,
        },
      });

      const isMutual = await this.checkIsFriend(myProfile.id, targetProfile.id);
      if (isMutual) {
        await this.ensurePrivateChat(myProfile, targetProfile, userId);
      }
    } else {
      void this.notificationsService.create({
        type: NotificationType.FOLLOW,
        title: 'Follow request',
        message: `@${myProfile.username} requested to follow you`,
        targetUserId: targetProfile.userId,
        createdBy: userId,
        data: {
          actorName: myProfile.displayName || myProfile.username,
          actorUsername: myProfile.username,
          actorAvatar: myProfile.avatarUrl,
          link: `/profile/${myProfile.username}`,
          isRequest: true,
        },
      });
    }

    return savedFollow;
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

  async getFriends(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const friendsAsFollowing = await this.followRepository.find({
      where: { followerId: profile.id, accepted: true },
      relations: ['following'],
    });

    const friendProfiles: Profile[] = [];
    for (const follow of friendsAsFollowing) {
      const mutualFollow = await this.followRepository.findOne({
        where: {
          followerId: follow.followingId,
          followingId: profile.id,
          accepted: true,
        },
      });
      if (mutualFollow) {
        friendProfiles.push(follow.following);
      }
    }

    return friendProfiles;
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
    const savedFollow = await this.followRepository.save(follow);

    void this.notificationsService.create({
      type: NotificationType.FOLLOW,
      title: 'Follow request accepted',
      message: `@${myProfile.username} accepted your follow request`,
      targetUserId: followerProfile.userId,
      createdBy: userId,
      data: {
        actorName: myProfile.displayName || myProfile.username,
        actorUsername: myProfile.username,
        actorAvatar: myProfile.avatarUrl,
        link: `/profile/${myProfile.username}`,
      },
    });

    const isMutual = await this.checkIsFriend(myProfile.id, followerProfile.id);
    if (isMutual) {
      await this.ensurePrivateChat(myProfile, followerProfile, userId);
    }

    return savedFollow;
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

    const block = this.blockRepository.create({
      blockerId: myProfile.id,
      blockedId: targetProfile.id,
    });

    await this.blockRepository.save(block);

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

  async getBlockedUsers(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const blocks = await this.blockRepository.find({
      where: { blockerId: profile.id },
      relations: ['blocked'],
    });
    return blocks.map((b) => b.blocked);
  }

  private async ensurePrivateChat(
    profileA: Profile,
    profileB: Profile,
    createdByUserId: string,
  ): Promise<void> {
    try {
      const existingChat = await this.chatRepository
        .createQueryBuilder('chat')
        .innerJoin('chat.participants', 'p1')
        .innerJoin('chat.participants', 'p2')
        .where('chat.type = :type', { type: ChatType.PRIVATE })
        .andWhere('p1.profileId = :aId', { aId: profileA.id })
        .andWhere('p2.profileId = :bId', { bId: profileB.id })
        .select('chat.id')
        .getOne();

      if (existingChat) return;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const chat = this.chatRepository.create({
          type: ChatType.PRIVATE,
          createdBy: createdByUserId,
          updatedBy: createdByUserId,
        });
        const savedChat = await queryRunner.manager.save(Chat, chat);

        const part1 = this.chatParticipantRepository.create({
          chatId: savedChat.id,
          profileId: profileA.id,
          role: ChatRole.MEMBER,
          createdBy: createdByUserId,
        });
        const part2 = this.chatParticipantRepository.create({
          chatId: savedChat.id,
          profileId: profileB.id,
          role: ChatRole.MEMBER,
          createdBy: createdByUserId,
        });

        await queryRunner.manager.save(ChatParticipant, [part1, part2]);
        await queryRunner.commitTransaction();

        this.logger.log(
          `Auto-created private chat between ${profileA.username} and ${profileB.username}`,
        );
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Failed to auto-create chat', err);
      } finally {
        await queryRunner.release();
      }
    } catch (err) {
      this.logger.error('ensurePrivateChat error', err);
    }
  }

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
