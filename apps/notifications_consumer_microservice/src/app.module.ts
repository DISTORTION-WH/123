import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as path from 'path';

@Module({
  imports: [
    // Загружаем .env из корня монорепозитория
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST') || 'smtp.ethereal.email',
          port: configService.get('SMTP_PORT') || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get('SMTP_USER') || 'test_user',
            pass: configService.get('SMTP_PASS') || 'test_pass',
          },
        },
        defaults: {
          from: '"Innogram No-Reply" <noreply@innogram.com>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
