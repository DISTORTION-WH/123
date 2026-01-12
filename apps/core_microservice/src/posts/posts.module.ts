import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../database/entities/post.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Profile } from '../database/entities/profile.entity';
import { Asset } from '../database/entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostAsset, Profile, Asset])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
