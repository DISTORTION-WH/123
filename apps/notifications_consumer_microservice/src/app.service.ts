import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(data: {
    email: string;
    username: string;
    displayName?: string;
  }) {
    this.logger.log(`Processing welcome email for: ${data.email}`);

    try {
      const subject = 'Welcome to Innogram!';
      const name = data.displayName || data.username;

      // В реальном проекте используем HTML шаблоны (hbs/pug),
      // но для базовой реализации достаточно HTML строки.
      const html = `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining <b>Innogram</b>.</p>
        <p>We are excited to have you on board.</p>
        <br/>
        <p>Best regards,<br/>The Innogram Team</p>
      `;

      await this.mailerService.sendMail({
        to: data.email,
        subject,
        html,
      });

      this.logger.log(`Welcome email sent successfully to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.email}`, error);
      // В реальной системе здесь можно реализовать механизм повторных попыток (Retry)
    }
  }

  getHello(): string {
    return 'Notifications Service is running';
  }
}
