import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../database/entities/user.entity';
import { Profile } from '../database/entities/profile.entity';

export interface AuthResponse {
  accessToken: string;
  refreshTokenId: string;
  user: {
    id: string;
    email: string;
    role: string;
    username: string;
  };
}

interface ValidateTokenResponse {
  isValid: boolean;
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://auth_microservice:3002';
  }

  async handleSignUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    // 1. Сначала делаем запрос к Auth Service.
    // Если он упадет — мы сразу вернем ошибку, так как регистрации не произошло.
    let authResponse: AuthResponse;
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/register`,
          signUpDto,
        ),
      );
      authResponse = data;
    } catch (error) {
      this.handleHttpError(error);
    }

    // 2. Теперь пытаемся сохранить пользователя локально.
    // Оборачиваем в отдельный try/catch, чтобы ошибка БД не ломала ответ клиенту.
    try {
      const existingUser = await this.userRepository.findOne({
        where: { id: authResponse.user.id },
      });

      if (!existingUser) {
        const user = this.userRepository.create({
          id: authResponse.user.id,
          email: authResponse.user.email,
          username: authResponse.user.username,
          role: authResponse.user.role,
        });

        await this.userRepository.save(user);

        // Используем displayName (согласно вашей последней миграции), а не first_name
        const profileData: any = {
          userId: user.id,
          username: authResponse.user.username,
          displayName: signUpDto.displayName || signUpDto.username,
          bio: signUpDto.bio,
          birthDate: signUpDto.birthday
            ? new Date(signUpDto.birthday)
            : undefined,
        };

        const profile = this.profileRepository.create(profileData);
        await this.profileRepository.save(profile);
        this.logger.log(`User ${user.id} synced to Core DB synchronously.`);
      }
    } catch (error: any) {
      // Если ошибка "Duplicate key" (23505) — это НОРМАЛЬНО.
      // Значит, RabbitMQ успел создать пользователя раньше нас.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === '23505') {
        this.logger.warn(
          `User duplicate detected during sync in Core (id: ${authResponse.user.id}), proceeding...`,
        );
      } else {
        // Если другая ошибка БД — логируем, но не крашим запрос,
        // так как пользователь фактически уже зарегистрирован.
        this.logger.error('Error syncing user to Core DB:', error);
      }
    }

    // Возвращаем успешный ответ от Auth Service в любом случае
    return authResponse;
  }

  async handleLogin(credentials: LoginDto): Promise<AuthResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/login`,
          credentials,
        ),
      );

      let user = await this.userRepository.findOne({
        where: { id: data.user.id },
        relations: ['profile'],
      });

      if (!user) {
        this.logger.log(
          `User ${data.user.id} missing in Core. Lazy syncing...`,
        );
        user = this.userRepository.create({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
        });
        await this.userRepository.save(user);
      }

      if (!user.profile) {
        const existingProfile = await this.profileRepository.findOne({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          // Исправление аналогично handleSignUp
          const profileData: any = {
            userId: user.id,
            username: data.user.username,
            first_name: data.user.username, // Замена firstName на first_name
          };

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const profile = this.profileRepository.create(profileData);
          await this.profileRepository.save(profile);
        }
      }

      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  async handleOAuthInit(provider: string): Promise<{ url: string }> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get<{ url: string }>(
          `${this.authServiceUrl}/internal/auth/oauth/initiate`,
          { params: { provider } },
        ),
      );
      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  async handleOAuthCallback(
    provider: string,
    authorizationCode: string,
  ): Promise<AuthResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/oauth/exchange-code`,
          { provider, code: authorizationCode },
        ),
      );
      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  async handleRefresh(refreshTokenId: string): Promise<AuthResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/refresh`,
          { refreshTokenId },
        ),
      );
      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  async handleLogout(
    refreshTokenId: string,
    accessToken?: string,
  ): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService.post(`${this.authServiceUrl}/internal/auth/logout`, {
          refreshTokenId,
          accessToken,
        }),
      );
    } catch {
      this.logger.warn('Logout warning: Auth service might be unavailable');
    }
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    try {
      this.logger.debug(
        `Validating token at ${this.authServiceUrl}/internal/auth/validate`,
      );
      const { data } = await lastValueFrom(
        this.httpService.post<ValidateTokenResponse>(
          `${this.authServiceUrl}/internal/auth/validate`,
          { accessToken },
        ),
      );
      this.logger.debug(`Token validation response:`, data);
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      this.logger.error(
        `Token validation failed: ${error.message}`,
        error.response?.data || error.response?.status,
      );
      throw new UnauthorizedException('Token validation failed');
    }
  }

  async handleForgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<{ message: string }>(
          `${this.authServiceUrl}/internal/auth/forgot-password`,
          dto,
        ),
      );
      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  async handleResetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<{ message: string }>(
          `${this.authServiceUrl}/internal/auth/reset-password`,
          dto,
        ),
      );
      return data;
    } catch (error) {
      this.handleHttpError(error);
    }
  }

  private handleHttpError(error: unknown): never {
    const axiosError = error as AxiosError<{ error: string; message?: string }>;
    this.logger.error(`Auth Service Error: ${axiosError.message}`);

    if (axiosError.response) {
      const { status, data } = axiosError.response;
      const message = data.error || data.message || 'Auth Service Error';

      if (status === 400) throw new BadRequestException(message);
      if (status === 401) throw new UnauthorizedException(message);
      if (status === 404) throw new BadRequestException('Resource not found');
    }

    throw new InternalServerErrorException(
      'Authentication Service Unavailable',
    );
  }
}
