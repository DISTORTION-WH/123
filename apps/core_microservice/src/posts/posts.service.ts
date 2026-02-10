import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Profile } from '../database/entities/profile.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostLike } from '../database/entities/post-like.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileFollow } from '../database/entities/profile-follow.entity';

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
  ) {}

  // Создание поста
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
      });

      const savedPost = await queryRunner.manager.save(Post, post);

      if (dto.fileIds && dto.fileIds.length > 0) {
        const postAssets: PostAsset[] = [];

        dto.fileIds.forEach((assetId, index) => {
          const postAsset = this.postAssetRepository.create({
            postId: savedPost.id,
            assetId: assetId,
            orderIndex: index,
            createdBy: userId,
          });
          postAssets.push(postAsset);
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

  // Получение поста по ID с проверкой лайка
  async findOne(id: string, currentUserId?: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['assets', 'assets.asset', 'profile'],
    });

    if (!post) throw new NotFoundException('Post not found');

    return await this.enrichPostWithLikeStatus(post, currentUserId);
  }

  // NEW: Генерация ленты новостей
  async getFeed(userId: string, page: number = 1, limit: number = 10) {
    const currentProfile =
      await this.profilesService.getProfileByUserId(userId);

    // 1. Получаем ID профилей, на которых подписан пользователь
    const follows = await this.followRepository.find({
      where: { followerId: currentProfile.id },
      select: ['followingId'],
    });

    const followingIds = follows.map((f) => f.followingId);

    // В ленту включаем свои посты и посты подписок
    const feedProfileIds = [currentProfile.id, ...followingIds];

    // 2. Получаем посты
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        profile: { id: In(feedProfileIds) },
        isArchived: false, // Don't show archived posts
      },
      relations: ['assets', 'assets.asset', 'profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // 3. Обогащаем информацией о лайках
    const enrichedPosts = await Promise.all(
      posts.map((post) => this.enrichPostWithLikeStatus(post, userId)),
    );

    return {
      data: enrichedPosts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // NEW: Получение постов конкретного пользователя
  async getPostsByUsername(username: string, currentUserId?: string) {
    const profile = await this.profilesService.getProfileByUsername(username);

    const posts = await this.postRepository.find({
      where: { profile: { id: profile.id }, isArchived: false },
      relations: ['assets', 'assets.asset', 'profile'],
      order: { createdAt: 'DESC' },
    });

    return await Promise.all(
      posts.map((post) => this.enrichPostWithLikeStatus(post, currentUserId)),
    );
  }

  // Лайки
  async toggleLike(userId: string, postId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const profile = await this.profilesService.getProfileByUserId(userId);

    const existingLike = await this.postLikeRepository.findOne({
      where: {
        postId: postId, // Use explicit ID column names
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
      return { message: 'Post liked', liked: true };
    }
  }

  // Helper: Обогащение поста статусом лайка и количеством
  private async enrichPostWithLikeStatus(post: Post, userId?: string) {
    const likesCount = await this.postLikeRepository.count({
      where: { postId: post.id },
    });
    let isLiked = false;

    if (userId) {
      const profile = await this.profilesService.getProfileByUserId(userId);
      const userLike = await this.postLikeRepository.findOne({
        where: { postId: post.id, profileId: profile.id },
      });
      isLiked = !!userLike;
    }

    return { ...post, likesCount, isLiked };
  }
}
