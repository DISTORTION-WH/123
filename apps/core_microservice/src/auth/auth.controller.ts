import { Body, Controller, Post, Res } from '@nestjs/common';
import express from 'express'; // Импортируем типы из express
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  // passthrough: true нужен, чтобы NestJS не перехватывал ответ полностью, а дал нам управлять хедерами
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // 1. Получаем токены и юзера от Auth Service
    const result = await this.authService.handleSignUp(signUpDto);
    // 2. Устанавливаем куки
    this.setAuthCookies(res, result.accessToken, result.refreshTokenId);

    // 3. Возвращаем только юзера, без токенов в теле
    return result.user;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.handleLogin(loginDto);
    this.setAuthCookies(res, result.accessToken, result.refreshTokenId);

    return result.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    // Чистим куки
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  private setAuthCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Скрипты на фронте не увидят куку (защита от XSS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 мин
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });
  }
}
