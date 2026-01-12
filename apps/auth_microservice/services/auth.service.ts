import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshTokenId, verifyAccessToken } from '../utils/jwt';
import { RedisAuthRepository } from '../repositories/redis.repository';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private redisRepository: RedisAuthRepository;

  constructor() {
    this.redisRepository = new RedisAuthRepository();
  }

  /**
   * Регистрация нового пользователя
   */
  async registerUser(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    birthday?: string;
    bio?: string;
  }) {
    // 1. Проверяем, существует ли пользователь
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // 2. Хешируем пароль
    const passwordHash = await hashPassword(data.password);

    // 3. Создаем пользователя
    const newUser = new User({
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName,
      birthday: data.birthday,
      bio: data.bio,
      role: 'User',
    });

    await newUser.save();

    // 4. Генерируем токены
    // ВАЖНО: Передаем username
    return this.generateTokens(newUser._id.toString(), newUser.role, newUser.email, newUser.username);
  }

  /**
   * Аутентификация (Login)
   */
  async authenticateUser(credentials: { email: string; password: string }) {
    // 1. Ищем пользователя по email
    const user = await User.findOne({ email: credentials.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Проверяем пароль
    const isMatch = await comparePassword(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // 3. Генерируем токены
    // ВАЖНО: Передаем username
    return this.generateTokens(user._id.toString(), user.role, user.email, user.username);
  }

  /**
   * Обновление токенов (Refresh Token Flow)
   */
  async refreshTokens(oldRefreshTokenId: string) {
    // 1. Ищем сессию в Redis по ID рефреш токена
    const sessionData = await this.redisRepository.findSessionByTokenId(oldRefreshTokenId);
    
    if (!sessionData) {
      throw new Error('Invalid or expired refresh token');
    }

    const { userId } = JSON.parse(sessionData);

    // 2. Проверяем, существует ли юзер в базе
    const user = await User.findById(userId);
    if (!user) {
      await this.redisRepository.deleteSession(oldRefreshTokenId);
      throw new Error('User not found');
    }

    // 3. Удаляем старую сессию
    await this.redisRepository.deleteSession(oldRefreshTokenId);

    // 4. Генерируем новую пару токенов
    // ВАЖНО: Передаем username
    return this.generateTokens(user._id.toString(), user.role, user.email, user.username);
  }

  /**
   * Валидация Access токена
   */
  async validateToken(accessToken: string) {
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return null;
    }

    const isBlacklisted = await this.redisRepository.isTokenBlacklisted(payload.jti, 'access');
    if (isBlacklisted) {
      return null;
    }

    return payload;
  }

  /**
   * Выход из системы (Logout)
   */
  async logout(refreshTokenId: string, accessToken?: string) {
    if (refreshTokenId) {
      await this.redisRepository.deleteSession(refreshTokenId);
    }

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload && payload.jti && payload.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.redisRepository.blacklistToken(payload.jti, 'access', expiresIn);
        }
      }
    }
  }

  /**
   * Приватный метод генерации пары токенов и сохранения сессии
   */
  // ВАЖНО: Добавлен аргумент username
  private async generateTokens(userId: string, role: string, email: string, username: string) {
    // Создаем JWT Access Token
    const { token: accessToken, jti } = generateAccessToken({ userId, role, email });
    
    // Создаем UUID для Refresh Token
    const refreshTokenId = generateRefreshTokenId();

    // Сохраняем связку Refresh ID -> User ID в Redis
    await this.redisRepository.storeRefreshTokenId(refreshTokenId, JSON.stringify({ userId }));

    return {
      // ВАЖНО: Возвращаем username, чтобы Core Service мог его сохранить
      user: { id: userId, email, role, username }, 
      accessToken,
      refreshTokenId,
    };
  }

  // --- Methods for Forgot/Reset Password (без изменений, но нужны для полноты файла) ---

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[Forgot Password] User with email ${email} not found. Doing nothing.`);
      return; 
    }
    const resetToken = uuidv4();
    await this.redisRepository.setResetToken(resetToken, user._id.toString());
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    console.log(`---------------------------------------------------------`);
    console.log(`[MOCK EMAIL SERVICE] Sending password reset link to ${email}`);
    console.log(`LINK: ${resetLink}`);
    console.log(`---------------------------------------------------------`);
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redisRepository.getAndDeleteResetToken(token);
    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();
    return { message: 'Password successfully updated' };
  }
}