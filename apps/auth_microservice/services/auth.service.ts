import User from '../models/User'; // Убедись, что модель User создана в src/models/User.ts
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshTokenId, verifyAccessToken } from '../utils/jwt';
import { RedisAuthRepository } from '../repositories/redis.repository';

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
      role: 'User', // Роль по умолчанию
    });

    await newUser.save();

    // 4. Генерируем токены
    return this.generateTokens(newUser._id.toString(), newUser.role, newUser.email);
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
    return this.generateTokens(user._id.toString(), user.role, user.email);
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

    // 2. Проверяем, существует ли юзер в базе (на случай удаления/бана)
    const user = await User.findById(userId);
    if (!user) {
      // Если юзера нет, чистим сессию
      await this.redisRepository.deleteSession(oldRefreshTokenId);
      throw new Error('User not found');
    }

    // 3. Удаляем старую сессию (Refresh Token Rotation)
    await this.redisRepository.deleteSession(oldRefreshTokenId);

    // 4. Генерируем новую пару токенов
    return this.generateTokens(user._id.toString(), user.role, user.email);
  }

  /**
   * Валидация Access токена
   */
  async validateToken(accessToken: string) {
    // 1. Проверяем подпись JWT
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return null; // Invalid signature or expired
    }

    // 2. Проверяем, не в черном ли списке этот токен (например, после логаута)
    // payload.jti - уникальный ID токена
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
    // 1. Удаляем сессию рефреш токена
    if (refreshTokenId) {
      await this.redisRepository.deleteSession(refreshTokenId);
    }

    // 2. (Опционально) Добавляем Access Token в черный список до конца его жизни
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
  private async generateTokens(userId: string, role: string, email: string) {
    // Создаем JWT Access Token
    const { token: accessToken, jti } = generateAccessToken({ userId, role, email });
    
    // Создаем UUID для Refresh Token
    const refreshTokenId = generateRefreshTokenId();

    // Сохраняем связку Refresh ID -> User ID в Redis
    await this.redisRepository.storeRefreshTokenId(refreshTokenId, JSON.stringify({ userId }));

    return {
      user: { id: userId, email, role },
      accessToken,
      refreshTokenId,
    };
  }
}