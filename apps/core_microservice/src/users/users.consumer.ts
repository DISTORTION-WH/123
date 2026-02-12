import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

// Интерфейс для типизации входящих событий (чтобы ESLint не ругался на unsafe access)
interface UserEventData {
  id: string;
  email?: string;
  [key: string]: any;
}

@Controller()
export class UsersConsumer {
  private readonly logger = new Logger(UsersConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Исправление: убрали async, так как нет await.
  // Исправление: убрали @Ctx() context, так как он не использовался.
  @EventPattern('user_created')
  handleUserCreated(@Payload() data: UserEventData) {
    this.logger.debug(
      `[RabbitMQ] Event 'user_created' received for ${data.email}. Handled synchronously via HTTP.`,
    );
  }

  // Исправление: убрали async, так как пока нет await (логика пустая).
  @EventPattern('user_updated')
  handleUserUpdated(@Payload() data: UserEventData) {
    this.logger.log(`Received user_updated event for ID: ${data.id}`);
    // Логика обновления будет здесь
  }
}
