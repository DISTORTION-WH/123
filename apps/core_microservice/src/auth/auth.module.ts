import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'; // 1. Импортируем TypeOrmModule
import { User } from '../database/entities/user.entity'; // 2. Импортируем сущность User
import { Profile } from '../database/entities/profile.entity'; // 3. Импортируем сущность Profile

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    // 4. Регистрируем репозитории для User и Profile, чтобы AuthService мог их использовать
    TypeOrmModule.forFeature([User, Profile]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
