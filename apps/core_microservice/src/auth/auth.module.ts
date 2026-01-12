import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../database/entities/user.entity'; // Import User entity
import { Profile } from '../database/entities/profile.entity'; // Import Profile entity

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([User, Profile]), // <--- ADD THIS LINE
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
