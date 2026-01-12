import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Контроллеры и сервисы самого приложения
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Функциональные модули
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    // 1. Глобальная конфигурация (.env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Подключение к Базе Данных (Async)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST', 'localhost'),
        port: configService.get<number>('POSTGRES_PORT', 5432),
        username: configService.get<string>('POSTGRES_USER', 'postgres'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
        database: configService.get<string>('POSTGRES_DB', 'innogram'),

        // Автоматическая загрузка сущностей
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,

        // ВАЖНО: synchronize ставим false, так как мы используем миграции.
        // Если оставить true, TypeORM будет пытаться менять схему сам при запуске,
        // что может вызвать конфликты с нашими файлами миграций.
        synchronize: false,
      }),
    }),

    // 3. Регистрация модулей приложения
    AuthModule,
    UsersModule,
    ProfilesModule,
    PostsModule, // Наш новый модуль постов
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
