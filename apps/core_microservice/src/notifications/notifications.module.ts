// apps/core_microservice/src/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../database/entities/notification.entity';
import { AuthModule } from '../auth/auth.module'; // <-- Добавляем импорт AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuthModule, // <-- Добавляем сюда, чтобы JwtAuthGuard мог получить AuthService
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
