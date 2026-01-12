import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { AuthModule } from '../auth/auth.module'; // <--- Import AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, User]),
    AuthModule, // <--- Add AuthModule here
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
