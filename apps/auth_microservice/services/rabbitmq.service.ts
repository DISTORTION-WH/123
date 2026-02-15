import * as amqp from 'amqplib';

class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queue = 'user_sync_queue';// Queue name for synchronizing users between Auth and Core/Notifications services

  async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

      console.log(`RabbitMQ connecting to ${url}...`);

      this.connection = await amqp.connect(url);// Establishing a connection to the message broker

      if (!this.connection) {
        throw new Error('Connection failed to initialize');
      }

      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Channel failed to initialize');
      }
// Declare a queue: durable=true means the queue will persist after a RabbitMQ reboot
      await this.channel.assertQueue(this.queue, { durable: true });

      console.log('RabbitMQ connected and queue asserted.');
    } catch (error) {
      console.error('RabbitMQ connection failed:', error);
    }
  }

  async publishUserCreated(user: Record<string, unknown>) {
    if (!this.channel) {
      console.warn('RabbitMQ channel not ready, attempting to connect...');
      await this.connect();
    }

    if (this.channel) {
      const message = JSON.stringify(user);
      this.channel.sendToQueue(this.queue, Buffer.from(message), {
        persistent: true,// persistent=true ensures that the message will be written to disk and will not be lost if the broker fails
      });
      console.log(`RabbitMQ sent user_created event for user: ${String(user.email)}`);
    } else {
      console.error('RabbitMQ failed to send message: Channel is still null');
    }
  }
}

export const rabbitMQService = new RabbitMQService();