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

  // In-memory cache for validated tokens (reduces load on Auth Microservice)
  private readonly tokenCache = new Map<
    string,
    { result: ValidateTokenResponse; expiresAt: number }
  >();
  private readonly TOKEN_CACHE_TTL = 60_000; // 1 minute cache

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
    // Periodically clear expired entries from the cache every 5 minutes
    setInterval(() => this.cleanTokenCache(), 5 * 60_000);
  }
  // Method for clearing memory from obsolete tokens
  private cleanTokenCache() {
    const now = Date.now();
    for (const [key, value] of this.tokenCache) {
      if (value.expiresAt <= now) {
        this.tokenCache.delete(key);
      }
    }
  }

  async handleSignUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    let authResponse: AuthResponse; // Send a registration request to the Auth Service
    try {
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/register`,
          signUpDto,
        ),
      );
      authResponse = data;
    } catch (error) {
      this.handleHttpError(error); // If the Auth Service returns an error, terminate the process
    }
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
        // Create a default profile for a new user
        const profileData: Partial<Profile> = {
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
    } catch (error) {
      // Handling data race: if RabbitMQ managed to create a record faster than us
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        this.logger.warn(
          `User duplicate detected during sync in Core (id: ${authResponse.user.id}), proceeding...`,
        );
      } else {
        this.logger.error('Error syncing user to Core DB:', error);
      }
    }
    return authResponse;
  }

  async handleLogin(credentials: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.debug(`Logging in user: ${credentials.email}`);
      const { data } = await lastValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/internal/auth/login`,
          credentials,
        ),
      );
      this.logger.debug(`Login successful, received user: ${data.user.id}`);

      let user = await this.userRepository.findOne({
        where: { id: data.user.id },
        relations: ['profile'],
      });

      if (!user) {
        // Lazy Sync: If the user doesn't exist, we create it on the fly.
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
          const profileData: Partial<Profile> = {
            userId: user.id,
            username: data.user.username,
            displayName: data.user.username,
          };

          const profile = this.profileRepository.create(profileData);
          await this.profileRepository.save(profile);
        }
      }

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
      this.logger.warn('Logout warning auth service might be unavailable');
    }
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponse> {
    // Check cache first
    const cached = this.tokenCache.get(accessToken);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

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

      // Cache valid tokens
      if (data.isValid) {
        this.tokenCache.set(accessToken, {
          result: data,
          expiresAt: Date.now() + this.TOKEN_CACHE_TTL,
        });
      }

      return data;
    } catch (error) {
      const axiosErr = error as AxiosError;
      this.logger.error(
        `Token validation failed: ${axiosErr.message}`,
        axiosErr.response?.data || axiosErr.response?.status,
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
    this.logger.error(`Auth Service error: ${axiosError.message}`, {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });

    if (axiosError.response) {
      const { status, data } = axiosError.response;
      const message = data.error || data.message || 'Auth Service error';

      if (status === 400) throw new BadRequestException(message);
      if (status === 401) throw new UnauthorizedException(message);
      if (status === 404) throw new BadRequestException('Resource not found');
    }

    throw new InternalServerErrorException(
      'Authentication Service Unavailable',
    );
  }
}
