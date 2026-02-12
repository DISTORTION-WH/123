import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Получаем переменные окружения (предполагаем, что они загрузятся через ConfigModule в AppModule)
  const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
  const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
  const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
  const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`,
        ],
        queue: 'notifications_queue',
        queueOptions: {
          durable: false, // В продакшене лучше true, но для разработки false упрощает очистку
        },
      },
    },
  );

  await app.listen();
  console.log('Notifications Microservice is listening via RabbitMQ...');
}
bootstrap();
