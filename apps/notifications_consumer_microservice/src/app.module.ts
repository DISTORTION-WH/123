import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    // Подключаем MailerModule асинхронно, чтобы использовать ConfigService
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      // Исправление: убрали async, так как чтение конфига синхронное
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST') || 'localhost',
          port: configService.get<number>('SMTP_PORT') || 1025, // Дефолтный порт для Mailhog
          secure: false, // true для 465, false для других портов
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"Innogram" <noreply@innogram.com>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, NotificationsController],
  providers: [AppService],
})
export class AppModule {}
