import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
          port: configService.get<number>('SMTP_PORT') || 587,
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER') || 'test_user',
            pass: configService.get<string>('SMTP_PASS') || 'test_pass',
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
