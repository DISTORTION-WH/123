import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { INestMicroservice } from '@nestjs/common';

async function bootstrap() {
  const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
  const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
  const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
  const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

  const app: INestMicroservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`,
        ],
        queue: 'notifications_queue',
        queueOptions: {
          durable: false,
        },
      },
    });

  await app.listen();
  console.log('Notifications Microservice is listening via RabbitMQ...');
}

bootstrap().catch((err) => {
  console.error('Error starting microservice:', err);
  process.exit(1);
});
