import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailerService: MailerService) {}

  sendLikeNotification(
    recipientEmail: string,
    likerName: string,
    postId: string,
  ) {
    this.logger.log(
      `Preparing to send email to ${recipientEmail} about post ${postId}...`,
    );

    try {
      this.logger.log(`Email sent successfully (Mocked)`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${errorMessage}`);
    }
  }
}
