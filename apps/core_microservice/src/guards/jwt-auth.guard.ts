import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const validationResult = await this.authService.validateToken(token);

      if (!validationResult || !validationResult.isValid) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach user to request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any).user = {
        id: validationResult.userId,
        email: validationResult.email,
        role: validationResult.role,
      };

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
