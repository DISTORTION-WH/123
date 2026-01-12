/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // --- ЛОГ ОТЛАДКИ ---
    console.log('------------------------------------------------');
    console.log('[Core Guard] Headers:', request.headers);
    console.log('[Core Guard] Auth Header:', authHeader);

    if (!authHeader) {
      console.log('[Core Guard] FAIL: No Authorization header');
      throw new UnauthorizedException('No authorization header');
    }

    const bearer = authHeader.split(' ')[0];
    const token = authHeader.split(' ')[1];

    if (bearer !== 'Bearer' || !token) {
      console.log(
        '[Core Guard] FAIL: Invalid format. Bearer:',
        bearer,
        'Token:',
        token,
      );
      throw new UnauthorizedException('Invalid authorization format');
    }

    console.log(
      '[Core Guard] Token extracted:',
      token.substring(0, 20) + '...',
    );

    try {
      // Валидируем токен через Auth Service
      const validationResult = await this.authService.validateToken(token);

      console.log('[Core Guard] Validation Result:', validationResult);

      if (!validationResult || !validationResult.isValid) {
        console.log('[Core Guard] FAIL: Validation returned false/null');
        throw new UnauthorizedException('Invalid token');
      }

      // Прикрепляем пользователя к запросу
      request.user = {
        id: validationResult.userId,
        email: validationResult.email,
        role: validationResult.role,
      };

      console.log('[Core Guard] SUCCESS: User attached to request');
      return true;
    } catch (e) {
      console.log('[Core Guard] FAIL: Exception during validation:', e.message);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
