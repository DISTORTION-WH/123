import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsController } from './notifications.controller'; // Импорт нового контроллера

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    // Здесь должны быть подключение к Mongo и MailerModule
  ],
  controllers: [AppController, NotificationsController], // Добавили контроллер
  providers: [AppService],
})
export class AppModule {}
