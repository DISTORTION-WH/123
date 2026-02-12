import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly mailerService: MailerService) {}

  // Убрали async, чтобы удовлетворить линтер (нет await внутри).
  // Когда подключите реальный mailerService.sendMail, верните async.
  sendLikeNotification(
    recipientEmail: string,
    likerName: string,
    postId: string,
  ) {
    // Эмуляция логики отправки
    this.logger.log(
      `📧 Preparing to send email to ${recipientEmail} about post ${postId}...`,
    );

    try {
      // В будущем здесь будет:
      /*
      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: `User ${likerName} liked your post`,
        html: `<p>User <b>${likerName}</b> liked your post <a href="...">#${postId}</a></p>`
      });
      */

      this.logger.log(`✅ Email sent successfully (Mocked)`);
    } catch (e) {
      // Безопасное получение сообщения об ошибке
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`❌ Failed to send email: ${errorMessage}`);
    }
  }
}
