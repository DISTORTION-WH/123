import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      // Прикрепляем пользователя к объекту сокета, чтобы иметь к нему доступ в Gateway
      client['user'] = payload;
    } catch {
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

    // Вариант 2: Query param (часто используется, если хедеры сложно прокинуть)
    // client.handshake.query.token

    return undefined;
  }
}
