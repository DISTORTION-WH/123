import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @EventPattern()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  handleUserSync(@Payload() data: any): void {
    console.log('[Notifications] Received event from RabbitMQ:', data);
  }
}
