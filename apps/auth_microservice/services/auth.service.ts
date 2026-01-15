import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshTokenId, verifyAccessToken } from '../utils/jwt';
import { RedisAuthRepository } from '../repositories/redis.repository';
import { UserRepository } from '../repositories/user.repository';

export class AuthService {
  private redisRepository: RedisAuthRepository;
  private userRepository: UserRepository; 
  
  private coreServiceUrl = process.env.CORE_SERVICE_URL || 'http://core_microservice:3000';

  constructor() {
    this.redisRepository = new RedisAuthRepository();
    this.userRepository = new UserRepository();
  }

  async registerUser(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    birthday?: string;
    bio?: string;
  }) {
    const existingUser = await this.userRepository.findByEmailOrUsername(data.email, data.username);

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();

    
    const newUser = await this.userRepository.create({
      _id: userId,
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName,
      birthday: data.birthday,
      bio: data.bio,
      role: 'User',
    });

    try {
      console.log(`[AuthService] Syncing user ${userId} to Core Service...`);
      await axios.post(`${this.coreServiceUrl}/internal/users/sync`, {
        id: userId,
        email: data.email,
        username: data.username,
      });
      console.log(`[AuthService] Sync success.`);
    } catch (error: any) {
      console.error('[AuthService] Failed to sync user with Core Service:', error.message);
    }

    return this.generateTokens(newUser._id.toString(), newUser.role, newUser.email, newUser.username);
  }

  async authenticateUser(credentials: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(credentials.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isMatch = await comparePassword(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    return this.generateTokens(user._id.toString(), user.role, user.email, user.username);
  }

  async refreshTokens(oldRefreshTokenId: string) {
    const sessionData = await this.redisRepository.findSessionByTokenId(oldRefreshTokenId);
    
    if (!sessionData) {
      throw new Error('Invalid or expired refresh token');
    }
    const { userId } = JSON.parse(sessionData);
    
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      await this.redisRepository.deleteSession(oldRefreshTokenId);
      throw new Error('User not found');
    }
    
    await this.redisRepository.deleteSession(oldRefreshTokenId);
    return this.generateTokens(user._id.toString(), user.role, user.email, user.username);
  }

  async validateToken(accessToken: string) {
    const payload = verifyAccessToken(accessToken);
    if (!payload) return null;
    
    try {
        const isBlacklisted = await this.redisRepository.isTokenBlacklisted(payload.jti, 'access');
        if (isBlacklisted) return null;
    } catch (err) {
        console.error('[Auth Service] REDIS ERROR:', err);
        return null; 
    }

    return {
      isValid: true,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

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

  private async generateTokens(userId: string, role: string, email: string, username: string) {
    const { token: accessToken, jti } = generateAccessToken({ userId, role, email });
    const refreshTokenId = generateRefreshTokenId();
    await this.redisRepository.storeRefreshTokenId(refreshTokenId, JSON.stringify({ userId }));
    
    return {
      user: { id: userId, email, role, username }, 
      accessToken,
      refreshTokenId,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      return; 
    }
    
    const resetToken = uuidv4();
    await this.redisRepository.setResetToken(resetToken, user._id.toString());
    
    const resetLink = `/auth/reset-password?token=${resetToken}`;
    console.log(`[MOCK EMAIL] Reset link for ${email}: ${resetLink}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redisRepository.getAndDeleteResetToken(token);
    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    
    await this.userRepository.save(user);
    
    return { message: 'Password successfully updated' };
  }
}