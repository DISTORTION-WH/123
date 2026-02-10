import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Profile } from '../database/entities/profile.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostLike } from '../database/entities/post-like.entity';
import { ProfilesService } from '../profiles/profiles.service';
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(PostAsset)
    private readonly postAssetRepository: Repository<PostAsset>,
    private readonly dataSource: DataSource,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

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

      return this.postRepository.findOne({
        where: { id: savedPost.id },
        relations: ['assets', 'assets.asset', 'profile'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async toggleLike(userId: string, postId: string) {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const profile = await this.profilesService.getProfileByUserId(userId);

    const existingLike = await this.postLikeRepository.findOne({
      where: {
        post: { id: postId },
        profile: { id: profile.id },
      },
    });

    if (existingLike) {
      await this.postLikeRepository.remove(existingLike);
      return { message: 'Post unliked', liked: false };
    } else {
      const newLike = this.postLikeRepository.create({
        post: { id: postId },
        profile: { id: profile.id },
        createdBy: userId,
        updatedBy: userId,
      });
      await this.postLikeRepository.save(newLike);
      return { message: 'Post liked', liked: true };
    }
  }
}
