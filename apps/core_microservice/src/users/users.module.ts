import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../database/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersConsumer } from './users.consumer';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, ProfilesModule],
  controllers: [UsersController, UsersConsumer],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
