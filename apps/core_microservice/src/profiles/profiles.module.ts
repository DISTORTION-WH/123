// apps/core_microservice/src/profiles/profiles.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { ProfileFollow } from '../database/entities/profile-follow.entity';
import { ProfileBlock } from '../database/entities/profile-block.entity'; // <-- Проверь этот импорт
import { AuthModule } from '../auth/auth.module'; // <-- Добавлено
@Module({
  imports: [
    // Добавляем ProfileBlock в массив сущностей
    TypeOrmModule.forFeature([Profile, ProfileFollow, ProfileBlock]),
    AuthModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService], // Убедись, что сервис экспортируется
})
export class ProfilesModule {}
