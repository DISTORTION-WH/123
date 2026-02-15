import { v4 as uuidv4 } from 'uuid';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshTokenId, verifyAccessToken } from '../utils/jwt';
import { RedisAuthRepository } from '../repositories/redis.repository';
import { UserRepository } from '../repositories/user.repository';
import { rabbitMQService } from './rabbitmq.service'; 

export class AuthService {
  private redisRepository: RedisAuthRepository;
  private userRepository: UserRepository;

  constructor() {
    // Initializing repositories for working with Redis and MongoDB
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
    // Check the uniqueness of the email and username before creating an account
    const existingUser = await this.userRepository.findByEmailOrUsername(data.email, data.username);

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }
// Hashing the password for secure storage in the database
    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();
// Create and save a user document in MongoDB
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
      console.log(`[AuthService] Publishing user_created event for ${userId}...`);
      
 // Send an event. Core can also listen for it,
// but most importantly, the Notifications Service listens for it to send email.
      await rabbitMQService.publishUserCreated({
        id: userId,
        email: data.email,
        username: data.username,
        displayName: data.displayName || data.username,
        birthday: data.birthday,
        bio: data.bio,
        role: 'User'
      });
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AuthService] WARNING: Failed to publish RabbitMQ event:', message);
    }
// Automatic login after registration: token generation
    return this.generateTokens(newUser._id.toString(), newUser.role, newUser.email, newUser.username);
  }

  async authenticateUser(credentials: { email: string; password: string }) {
    console.log('[AuthService] Looking for user with email:', credentials.email);
    const user = await this.userRepository.findByEmail(credentials.email);

    if (!user) {
      console.log('[AuthService] User not found:', credentials.email);
      throw new Error('Invalid credentials');
    }
    console.log('[AuthService] User found, verifying password');
    // Check the hash of the entered password with the one stored in the database
    const isMatch = await comparePassword(credentials.password, user.passwordHash);
    if (!isMatch) {
      console.log('[AuthService] Password mismatch');
      throw new Error('Invalid credentials');
    }
    console.log('[AuthService] Generating tokens for user:', user._id);
    // Successful authentication: return a pair of tokens
    return this.generateTokens(user._id.toString(), user.role, user.email, user.username);
  }

  async refreshTokens(oldRefreshTokenId: string) {
    // Checking the existence of a session in Redis using the refresh token ID
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
// If the user is deleted, clear his session
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
    if (refreshTokenId) {// Remove session refresh token from Redis
      await this.redisRepository.deleteSession(refreshTokenId);
    }
    if (accessToken) {// Adding an access token to the blacklist before its lifetime expires
      const payload = verifyAccessToken(accessToken);
      if (payload && payload.jti && payload.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.redisRepository.blacklistToken(payload.jti, 'access', expiresIn);
        }
      }
    }
  }
// Private method for generating access and refresh tokens
  private async generateTokens(userId: string, role: string, email: string, username: string) {
    const { token: accessToken } = generateAccessToken({ userId, role, email });
    const refreshTokenId = generateRefreshTokenId();
    // Store the refresh token binding to the user in Redis
    await this.redisRepository.storeRefreshTokenId(refreshTokenId, JSON.stringify({ userId }));

    return {
      user: { id: userId, email, role, username },
      accessToken,
      refreshTokenId,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;
// Generate a temporary reset token
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