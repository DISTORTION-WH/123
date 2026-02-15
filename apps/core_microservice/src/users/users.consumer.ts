import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

interface UserEventData {
  id: string;
  email?: string;
  username?: string;
}

@Controller()
export class UsersConsumer {
  private readonly logger = new Logger(UsersConsumer.name);

  @EventPattern('user_created')
  handleUserCreated(@Payload() data: UserEventData) {
    this.logger.debug(
      `RabbitMQ event 'user_created' received for ${data.email}. Handled synchronously via HTTP.`,
    );
  }

  @EventPattern('user_updated')
  handleUserUpdated(@Payload() data: UserEventData) {
    this.logger.log(`Received user_updated event for ID: ${data.id}`);
  }
}
