import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('AppService', () => {
  let service: AppService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const mailerServiceMock = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: MailerService,
          useValue: mailerServiceMock,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send an email successfully', async () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      };

      await service.sendWelcomeEmail(data);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: data.email,
          subject: 'Welcome to Innotok!',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          html: expect.stringContaining('Welcome, Test User!'),
        }),
      );
    });

    it('should use username if displayName is missing', async () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
      };

      await service.sendWelcomeEmail(data);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          html: expect.stringContaining('Welcome, testuser!'),
        }),
      );
    });

    it('should handle errors gracefully without throwing', async () => {
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValueOnce(new Error('SMTP Error'));

      const data = {
        email: 'fail@example.com',
        username: 'failuser',
      };

      await expect(service.sendWelcomeEmail(data)).resolves.not.toThrow();
    });
  });
});
