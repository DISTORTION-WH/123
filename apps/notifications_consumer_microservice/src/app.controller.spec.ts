import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserCreatedDto } from './dtos/user-created.dto';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const appServiceMock = {
      sendWelcomeEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('handleUserCreated', () => {
    it('should call sendWelcomeEmail with correct data', async () => {
      const dto: UserCreatedDto = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      };

      await appController.handleUserCreated(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(appService.sendWelcomeEmail).toHaveBeenCalledWith({
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
      });
    });

    it('should not call sendWelcomeEmail if data is invalid', async () => {
      // @ts-expect-error: testing invalid input
      await appController.handleUserCreated({});
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(appService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });
});
