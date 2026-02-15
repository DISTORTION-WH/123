import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { UserCreatedDto } from './dtos/user-created.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: UserCreatedDto) {
    this.logger.log(`Received event user_created for ${data.email}`);

    if (data && data.email) {
      await this.appService.sendWelcomeEmail({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
      });
    }
  }
}
