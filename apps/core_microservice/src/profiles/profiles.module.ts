import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { AuthModule } from '../auth/auth.module'; // 1. Импортируем AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, ProfileFollow]),
    AuthModule, // 2. Добавляем в imports
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
