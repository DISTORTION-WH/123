import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Profile } from '../database/entities/profile.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostLike } from '../database/entities/post-like.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { NOTIFICATIONS_SERVICE } from '../constants/services';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(PostAsset)
    private readonly postAssetRepository: Repository<PostAsset>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(ProfileFollow)
    private readonly followRepository: Repository<ProfileFollow>,
    private readonly dataSource: DataSource,
    private readonly profilesService: ProfilesService,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsClient: ClientProxy,
  ) {}

  // --- CREATE ---
  async create(userId: string, dto: CreatePostDto) {
    const profile = await this.profilesService.getProfileByUserId(userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const post = this.postRepository.create({
        content: dto.content,
        profile: profile,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedPost = await queryRunner.manager.save(Post, post);

      if (dto.fileIds && dto.fileIds.length > 0) {
        const postAssets: PostAsset[] = dto.fileIds.map((assetId, index) => {
          return this.postAssetRepository.create({
            postId: savedPost.id,
            assetId: assetId,
            orderIndex: index,
            createdBy: userId,
          });
        });

        await queryRunner.manager.save(PostAsset, postAssets);
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedPost.id, userId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- READ ---
  async findOne(id: string, currentUserId?: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['assets', 'assets.asset', 'profile'],
      order: {
        assets: { orderIndex: 'ASC' },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    return await this.enrichPostWithLikeStatus(post, currentUserId);
  }

  async getFeed(userId: string, page: number = 1, limit: number = 10) {
    const currentProfile =
      await this.profilesService.getProfileByUserId(userId);

    const follows = await this.followRepository.find({
      where: { followerId: currentProfile.id, accepted: true },
      select: ['followingId'],
    });

    const followingIds = follows.map((f) => f.followingId);
    const feedProfileIds = [currentProfile.id, ...followingIds];

    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        profile: { id: In(feedProfileIds) },
        isArchived: false,
      },
      relations: ['assets', 'assets.asset', 'profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const enrichedPosts = await Promise.all(
      posts.map((post) => this.enrichPostWithLikeStatus(post, userId)),
    );

    return {
      data: enrichedPosts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPostsByUsername(
    username: string,
    currentUserId?: string,
    page: number = 1,
    limit: number = 12,
  ) {
    const profile = await this.profilesService.getProfileByUsername(username);

    const [posts, total] = await this.postRepository.findAndCount({
      where: { profile: { id: profile.id }, isArchived: false },
      relations: ['assets', 'assets.asset', 'profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const enrichedPosts = await Promise.all(
      posts.map((post) => this.enrichPostWithLikeStatus(post, currentUserId)),
    );

    return {
      data: enrichedPosts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- UPDATE ---
  async update(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) throw new NotFoundException('Post not found');
    if (post.createdBy !== userId)
      throw new ForbiddenException('You are not allowed to edit this post');

    if (dto.content !== undefined) post.content = dto.content;
    if (dto.isArchived !== undefined) post.isArchived = dto.isArchived;

    post.updatedBy = userId;

    if (dto.fileIds) {
      await this.postAssetRepository.delete({ postId });

      const newAssets = dto.fileIds.map((assetId, index) =>
        this.postAssetRepository.create({
          postId,
          assetId,
          orderIndex: index,
          createdBy: userId,
        }),
      );
      await this.postAssetRepository.save(newAssets);
    }

    await this.postRepository.save(post);

    return this.findOne(postId, userId);
  }

  // --- DELETE ---
  async remove(postId: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) throw new NotFoundException('Post not found');
    if (post.createdBy !== userId)
      throw new ForbiddenException('You are not allowed to delete this post');

    await this.postRepository.remove(post);
    return { message: 'Post deleted successfully', id: postId };
  }

  // --- LIKES ---
  async toggleLike(userId: string, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['profile', 'profile.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const profile = await this.profilesService.getProfileByUserId(userId);

    const existingLike = await this.postLikeRepository.findOne({
      where: {
        postId: postId,
        profileId: profile.id,
      },
    });

    if (existingLike) {
      await this.postLikeRepository.remove(existingLike);
      return { message: 'Post unliked', liked: false };
    } else {
      const newLike = this.postLikeRepository.create({
        postId: postId,
        profileId: profile.id,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.postLikeRepository.save(newLike);

      if (post.createdBy !== userId) {
        this.notificationsClient.emit('post_liked', {
          actorId: userId,
          targetUserId: post.profile.userId,
          targetUserEmail: post.profile.user.email, // Добавляем Email!
          postId: postId,
          timestamp: new Date().toISOString(),
        });
      }

      return { message: 'Post liked', liked: true };
    }
  }

  private async enrichPostWithLikeStatus(post: Post, userId?: string) {
    const likesCount = await this.postLikeRepository.count({
      where: { postId: post.id },
    });
    let isLiked = false;

    if (userId) {
      const profile = await this.profilesService.getProfileByUserId(userId);
      if (profile) {
        const userLike = await this.postLikeRepository.findOne({
          where: { postId: post.id, profileId: profile.id },
        });
        isLiked = !!userLike;
      }
    }

    return { ...post, likesCount, isLiked };
  }
}
