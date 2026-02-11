import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { ProfilesService } from '../../profiles/profiles.service'; // Добавлен импорт

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly profilesService: ProfilesService, // Инъекция сервиса профилей
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // 1. Валидация токена
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // 2. Получение профиля для username (которого нет в токене)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = payload.userId as string;
      const profile = await this.profilesService.getProfileByUserId(userId);

      // 3. Формирование объекта пользователя для сокета
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      client['user'] = {
        ...payload,
        sub: userId, // Gateway использует sub
        userId: userId,
        username: profile.username, // Gateway использует username
      };
    } catch (err) {
      console.error('WS Auth failed:', err);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Вариант 1: Authorization Header (стандартный для современных клиентов)
    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      return token;
    }

    // Вариант 2: Query param (для удобства тестирования или старых клиентов)
    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return undefined;
  }
}
