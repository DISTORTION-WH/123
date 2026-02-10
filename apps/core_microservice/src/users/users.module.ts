import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../database/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module'; // CHANGE: Добавлен импорт

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    ProfilesModule, // CHANGE: Необходимо для доступа к ProfilesService или репозиторию
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
