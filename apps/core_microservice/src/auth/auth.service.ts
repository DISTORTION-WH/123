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
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/register`,
          signUpDto,
        ),
      );

      const existingUser = await this.userRepository.findOne({
        where: { id: data.user.id },
      });

      if (!existingUser) {
        const user = this.userRepository.create({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
        });

        await this.userRepository.save(user);

        const profile = this.profileRepository.create({
          user: user,
          userId: user.id,
          username: data.user.username,
          firstName: signUpDto.displayName || signUpDto.username,
          bio: signUpDto.bio,
          birthDate: signUpDto.birthday
            ? new Date(signUpDto.birthday)
            : undefined,
        });

        await this.profileRepository.save(profile);
        this.logger.log(`User ${user.id} synced to Core DB synchronously.`);
      }

      return data;
    } catch (error: unknown) {
      // Исправление: безопасное приведение типа для доступа к .code
      const dbError = error as { code?: string };
      if (dbError?.code === '23505') {
        this.logger.warn(
          'User duplicate detected during sync in Core, proceeding...',
        );
      } else {
        this.handleHttpError(error);
      }
      throw error;
    }
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
          const profile = this.profileRepository.create({
            user: user,
            userId: user.id,
            username: data.user.username,
            firstName: data.user.username,
          });
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
      // Исправление: убрана неиспользуемая переменная error
      this.logger.warn('Logout warning: Auth service might be unavailable');
    }
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<ValidateTokenResponse>(
          `${this.authServiceUrl}/internal/auth/validate`,
          { accessToken },
        ),
      );
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      this.logger.error(`Token validation failed`);
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
