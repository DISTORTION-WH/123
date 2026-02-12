// apps/core_microservice/src/chats/guards/ws-jwt.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { ProfilesService } from '../../profiles/profiles.service';

// 1. Описываем структуру пользователя
interface ChatUser {
  userId: string;
  sub: string;
  username: string;
  id: string;
  [key: string]: any;
}

// 2. Расширяем тип Socket, чтобы TS знал о поле data.user
interface AuthenticatedSocket extends Socket {
  data: {
    user?: ChatUser;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly profilesService: ProfilesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 3. Используем наш расширенный интерфейс вместо обычного Socket
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ userId: string }>(
        token,
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        },
      );

      const userId = payload.userId;
      const profile = await this.profilesService.getProfileByUserId(userId);

      const user: ChatUser = {
        ...payload,
        id: userId,
        sub: userId,
        userId: userId,
        username: profile.username,
      };

      // 4. Теперь это безопасно, так как мы типизировали client.data
      client.data.user = user;

      // 5. Исправлено использование ts-ignore на ts-expect-error
      // Используем @ts-expect-error, так как свойства 'user' официально нет в типе Socket,
      // но мы хотим сохранить обратную совместимость.
      client['user'] = user;
    } catch (err) {
      console.error('WS Auth failed:', err);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      return token;
    }
    const queryToken = client.handshake.query.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    return undefined;
  }
}
