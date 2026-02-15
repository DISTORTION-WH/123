import redisClient from '../config/redis';

const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days
const RESET_PASSWORD_TTL = 15 * 60;   // 15 mins

export class RedisAuthRepository {
// Checks if the token is in the "black list" (used when validating each request)
  async isTokenBlacklisted(tokenId: string, type: 'access' | 'refresh'): Promise<boolean> {
    const key = `blacklist:${type}:${tokenId}`;
    const result = await redisClient.get(key);
    return result === 'true';
  }

  async blacklistToken(tokenId: string, type: 'access' | 'refresh', expiresIn: number): Promise<void> {
    const key = `blacklist:${type}:${tokenId}`;
    // Block the token only if it is still valid
    if (expiresIn > 0) {
      await redisClient.setex(key, expiresIn, 'true');
    }
  }
// Stores user session data associated with the refresh token ID
  async storeRefreshTokenId(refreshTokenId: string, sessionData: string): Promise<void> {
    const key = `refresh_tokens:${refreshTokenId}`;
    await redisClient.setex(key, REFRESH_TTL, sessionData);
  }
// Gets session data by refresh token ID (if the session has not expired or been deleted)
  async findSessionByTokenId(refreshTokenId: string): Promise<string | null> {
    const key = `refresh_tokens:${refreshTokenId}`;
    return await redisClient.get(key);
  }
// Removes the session from Redis (on Logout or when rotating the Refresh token)
  async deleteSession(refreshTokenId: string): Promise<void> {
    const key = `refresh_tokens:${refreshTokenId}`;
    await redisClient.del(key);
  }

  
  async setResetToken(token: string, userId: string): Promise<void> {
    const key = `reset_password:${token}`;
    await redisClient.setex(key, RESET_PASSWORD_TTL, userId);
  }
// Returns the user ID for the reset token and immediately deletes the token (one-time use guaranteed)
  async getAndDeleteResetToken(token: string): Promise<string | null> {
    const key = `reset_password:${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      await redisClient.del(key); // Удаляем ключ, чтобы токен нельзя было использовать повторно
    }
    return userId;
  }
}