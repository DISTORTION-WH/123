import * as amqp from 'amqplib';
import { env } from '../config/env';

class RabbitMQService {
  // CHANGE: Используем any, чтобы обойти ошибку типов.
  // В рантайме метод createChannel существует, но TypeScript его не видит из-за конфликта версий @types.
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private readonly queue = 'user_sync_queue';

  async connect() {
    try {
      const url = process.env.RABBITMQ_URL || `amqp://${env.REDIS_HOST}:5672`;
      
      console.log(`[RabbitMQ] Connecting to ${url}...`);
      
      // Подключаемся
      this.connection = await amqp.connect(url);
      
      if (!this.connection) {
        throw new Error('Connection failed to initialize');
      }

      // Теперь ошибки не будет, так как this.connection имеет тип any
      this.channel = await this.connection.createChannel();
      
      if (!this.channel) {
         throw new Error('Channel failed to initialize');
      }

      // Создаем очередь
      await this.channel.assertQueue(this.queue, { durable: true });
      
      console.log('[RabbitMQ] Connected and queue asserted.');
    } catch (error) {
      console.error('[RabbitMQ] Connection failed:', error);
      // Логика реконнекта может быть добавлена здесь
    }
  }

  async publishUserCreated(user: Record<string, any>) {
    if (!this.channel) {
      console.warn('[RabbitMQ] Channel not ready, attempting to connect...');
      await this.connect();
    }

    if (this.channel) {
      const message = JSON.stringify(user);
      // Отправляем сообщение в очередь
      this.channel.sendToQueue(this.queue, Buffer.from(message), {
        persistent: true, // Сообщение сохраняется на диске брокера
      });
      console.log(`[RabbitMQ] Sent user_created event for user: ${user.email}`);
    } else {
      console.error('[RabbitMQ] Failed to send message: Channel is still null');
    }
  }
}

export const rabbitMQService = new RabbitMQService();