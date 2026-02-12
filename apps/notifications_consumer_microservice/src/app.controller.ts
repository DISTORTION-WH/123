import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AppService } from './app.service';
import { UserCreatedDto } from './dtos/user-created.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @EventPattern('user_created')
  async handleUserCreated(
    @Payload() data: UserCreatedDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Ctx() _context: RmqContext,
  ) {
    this.logger.log(`Received event: user_created for ${data.email}`);

    if (data && data.email) {
      await this.appService.sendWelcomeEmail({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
      });
    }
  }
}
