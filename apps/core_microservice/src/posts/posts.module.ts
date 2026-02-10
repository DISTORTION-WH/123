import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Asset } from '../database/entities/asset.entity';
import { PostAsset } from '../database/entities/post-asset.entity';
import { Post } from '../database/entities/post.entity';
import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthModule } from '../auth/auth.module';
import { PostLike } from '../database/entities/post-like.entity';
import { ProfilesModule } from '../profiles/profiles.module';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Asset,
      PostAsset,
      User,
      Profile,
      PostLike,
      ProfileFollow,
    ]),
    AuthModule,
    ProfilesModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
