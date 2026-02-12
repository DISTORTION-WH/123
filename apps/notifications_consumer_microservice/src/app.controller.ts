import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Received event: user_created', data);

    // Валидация данных (простая)
    if (data && data.email) {
      await this.appService.sendWelcomeEmail({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
      });
    }

    // Подтверждаем получение сообщения (если включен manualAck, но здесь мы используем авто-подтверждение по умолчанию)
  }
}
