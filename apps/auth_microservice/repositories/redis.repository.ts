import redisClient from '../config/redis';

const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 дней
const RESET_PASSWORD_TTL = 15 * 60;   // 15 минут

export class RedisAuthRepository {
  // ... существующие методы ...

  async isTokenBlacklisted(tokenId: string, type: 'access' | 'refresh'): Promise<boolean> {
    const key = `blacklist:${type}:${tokenId}`;
    const result = await redisClient.get(key);
    return result === 'true';
  }

  async blacklistToken(tokenId: string, type: 'access' | 'refresh', expiresIn: number): Promise<void> {
    const key = `blacklist:${type}:${tokenId}`;
    if (expiresIn > 0) {
      await redisClient.setex(key, expiresIn, 'true');
    }
  }

  async storeRefreshTokenId(refreshTokenId: string, sessionData: string): Promise<void> {
    const key = `refresh_tokens:${refreshTokenId}`;
    await redisClient.setex(key, REFRESH_TTL, sessionData);
  }

  async findSessionByTokenId(refreshTokenId: string): Promise<string | null> {
    const key = `refresh_tokens:${refreshTokenId}`;
    return await redisClient.get(key);
  }

  async deleteSession(refreshTokenId: string): Promise<void> {
    const key = `refresh_tokens:${refreshTokenId}`;
    await redisClient.del(key);
  }

  // --- НОВЫЕ МЕТОДЫ ДЛЯ СБРОСА ПАРОЛЯ ---

  /**
   * Сохранить токен сброса пароля, привязанный к userId
   */
  async setResetToken(token: string, userId: string): Promise<void> {
    const key = `reset_password:${token}`;
    await redisClient.setex(key, RESET_PASSWORD_TTL, userId);
  }

  /**
   * Получить userId по токену и сразу удалить токен (одноразовое использование)
   */
  async getAndDeleteResetToken(token: string): Promise<string | null> {
    const key = `reset_password:${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      await redisClient.del(key); // Токен больше недействителен после использования
    }
    return userId;
  }
}