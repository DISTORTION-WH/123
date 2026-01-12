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

import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

export interface AuthResponse {
  accessToken: string;
  refreshTokenId: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      return data;
    } catch (error) {
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
          {
            params: { provider },
          },
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
          {
            provider,
            code: authorizationCode,
          },
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

  async handleLogout(refreshTokenId: string): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService.post(`${this.authServiceUrl}/internal/auth/logout`, {
          refreshTokenId,
        }),
      );
    } catch (error) {
      console.warn('Logout warning:', error);
    }
  }

  async validateToken(accessToken: string): Promise<{
    isValid: boolean;
    userId: string;
    email: string;
    role: string;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await lastValueFrom(
        this.httpService.post(`${this.authServiceUrl}/internal/auth/validate`, {
          accessToken,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private handleHttpError(error: unknown): never {
    const axiosError = error as AxiosError<{ error: string; message?: string }>;
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
