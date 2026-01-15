/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
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
      'http://localhost:3002';
  }

  async handleSignUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/register`,
          signUpDto,
        ),
      );

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

      return data;
    } catch (error: any) {
      if (error && error.code === '23505') {
        console.warn(
          'User or Profile already exists in Core DB, skipping sync',
        );
      }
      this.handleHttpError(error);
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
    } catch (error) {
      console.warn('Logout warning:', error);
    }
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    try {
      console.log(
        `[AuthService Core] Sending validation request to: ${this.authServiceUrl}/internal/auth/validate`,
      );

      const { data } = await lastValueFrom(
        this.httpService.post<ValidateTokenResponse>(
          `${this.authServiceUrl}/internal/auth/validate`,
          { accessToken },
        ),
      );

      console.log('[AuthService Core] Validation response:', data);
      return data;
    } catch (error: any) {
      console.log('[AuthService Core] ERROR validating token:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      } else if (error.code) {
        console.log('Error Code:', error.code);
        console.log('Message:', error.message);
      } else {
        console.log('Error:', error);
      }

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

    console.log('URL:', axiosError.config?.url);
    console.log('Method:', axiosError.config?.method);

    if (axiosError.response) {
      console.log(' Response Status:', axiosError.response.status);
      console.log(
        ' Response Data:',
        JSON.stringify(axiosError.response.data, null, 2),
      );
    } else {
      console.log('No Response (Network Error) or DB Error');
      console.log('Error Code:', axiosError.code);
      console.log('Error Message:', axiosError.message);

      if (axiosError['code'] && !isNaN(Number(axiosError['code']))) {
        console.log(' DATABASE ERROR detected inside Auth Service wrapper');
        throw error;
      }

      if (axiosError.code === 'ECONNREFUSED') {
        console.log(
          ' ПОДСКАЗКА: Core сервис не может найти Auth сервис по этому адресу/порту.',
        );
      }
    }

    if (axiosError.response) {
      const { status, data } = axiosError.response;
      const message =
        data.error || data.message || 'Error communicating with Auth Service';

      if (status === 400) throw new BadRequestException(message);
      if (status === 401) throw new UnauthorizedException(message);
      if (status === 404)
        throw new BadRequestException('Resource not found in Auth Service');
    }

    throw new InternalServerErrorException(
      'Authentication Service Unavailable',
    );
  }
}
