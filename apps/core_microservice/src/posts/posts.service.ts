import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Profile } from '../database/entities/profile.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(PostAsset)
    private readonly postAssetRepository: Repository<PostAsset>,
    // Используем DataSource для транзакций (чтобы пост и картинки создавались атомарно)
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    // 1. Получаем профиль автора
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    // Запускаем транзакцию: или сохраняется всё, или ничего
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Создаем пост
      const post = this.postRepository.create({
        content: dto.content,
        profile: profile,
        createdBy: userId,
      });

      const savedPost = await queryRunner.manager.save(Post, post);

      // 3. Если есть файлы, привязываем их
      if (dto.fileIds && dto.fileIds.length > 0) {
        const postAssets: PostAsset[] = [];

        dto.fileIds.forEach((assetId, index) => {
          const postAsset = this.postAssetRepository.create({
            postId: savedPost.id,
            assetId: assetId,
            orderIndex: index, // Сохраняем порядок файлов
            createdBy: userId,
          });
          postAssets.push(postAsset);
        });

        await queryRunner.manager.save(PostAsset, postAssets);
      }

      await queryRunner.commitTransaction();

      // Возвращаем пост вместе с ассетами для отображения
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
}
