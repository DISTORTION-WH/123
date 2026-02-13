import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Создаем гибридное приложение (HTTP + Microservice)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Настройка статики
  // In development: __dirname = src, so we go up to app root then to uploads
  // In production: __dirname = dist/src, so we need to go up 2 levels then to uploads
  let uploadsPath: string;
  if (__dirname.includes('dist')) {
    // Production build
    uploadsPath = join(__dirname, '..', '..', 'uploads');
  } else {
    // Development (ts-node)
    uploadsPath = join(__dirname, '..', 'uploads');
  }
  console.log(`Static assets path: ${uploadsPath}`);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Innogram Core API')
    .setDescription(
      'Core Microservice API for Innogram Social Media Application',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CHANGE: Подключение микросервиса RabbitMQ
  // Мы используем тот же URL что и в docker-compose
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'user_sync_queue', // Та же очередь, куда пишет Auth Service
      queueOptions: {
        durable: true,
      },
      // noAck: false, // Можно включить ручное подтверждение, если требуется гарантия обработки
    },
  });

  // Запуск микросервисов
  await app.startAllMicroservices();

  // Запуск HTTP сервера
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Core Microservice running on port ${port}`);
  console.log(`Microservice is listening on RabbitMQ queue: user_sync_queue`);
  console.log(
    `API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
