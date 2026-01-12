import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Важно!
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
// Импортируй остальные сущности, если они есть

@Module({
  imports: [
    // 1. Загружаем .env файл глобально
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Ищет файл в корне папки микросервиса
    }),

    // 2. Асинхронно подключаем базу, используя ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        // Читаем переменные. Если их нет - упадет с понятной ошибкой или возьмет дефолт
        host: configService.get<string>('POSTGRES_HOST', '127.0.0.1'),
        port: configService.get<number>('POSTGRES_PORT', 5435),
        username: configService.get<string>('POSTGRES_USER', 'innogram_user'),
        password: configService.get<string>(
          'POSTGRES_PASSWORD',
          'innogram_password',
        ),
        database: configService.get<string>('POSTGRES_DB', 'innogram'),

        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Auto-schema update (dev only)
        autoLoadEntities: true,
      }),
    }),

    AuthModule,
    // ... другие модули
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
