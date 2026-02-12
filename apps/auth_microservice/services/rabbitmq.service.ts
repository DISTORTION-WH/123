import * as amqp from 'amqplib';

class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queue = 'user_sync_queue';

  async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

      console.log(`[RabbitMQ] Connecting to ${url}...`);

      this.connection = await amqp.connect(url);

      if (!this.connection) {
        throw new Error('Connection failed to initialize');
      }

      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Channel failed to initialize');
      }

      await this.channel.assertQueue(this.queue, { durable: true });

      console.log('[RabbitMQ] Connected and queue asserted.');
    } catch (error) {
      console.error('[RabbitMQ] Connection failed:', error);
    }
  }

  async publishUserCreated(user: Record<string, unknown>) {
    if (!this.channel) {
      console.warn('[RabbitMQ] Channel not ready, attempting to connect...');
      await this.connect();
    }

    if (this.channel) {
      const message = JSON.stringify(user);
      this.channel.sendToQueue(this.queue, Buffer.from(message), {
        persistent: true,
      });
      console.log(`[RabbitMQ] Sent user_created event for user: ${String(user.email)}`);
    } else {
      console.error('[RabbitMQ] Failed to send message: Channel is still null');
    }
  }
}

export const rabbitMQService = new RabbitMQService();