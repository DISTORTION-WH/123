import { z } from 'zod';

// DTO for validating incoming data when registering a new user
export class RegisterEntity {
  private static schema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z.string().min(3, "Username must be at least 3 chars").max(30),
    password: z.string().min(6, "Password must be at least 6 chars"),
    displayName: z.string().optional(),
    birthday: z.string().optional(),
    bio: z.string().max(300).optional(),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class LoginEntity {
  private static schema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class RefreshTokenEntity {
  private static schema = z.object({
    refreshTokenId: z.string().uuid({ message: "Invalid refresh token format" }),
  });
// Используется для поиска сессии в Redis при обновлении токенов
  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class ValidateTokenEntity {
  private static schema = z.object({
    accessToken: z.string().min(1, "Access token is required"),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class LogoutEntity {
  private static schema = z.object({
    refreshTokenId: z.string().uuid(),// Refresh token ID is required to delete a session
    accessToken: z.string().optional(),// Access token is optional, but recommended for adding to blacklist
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class ForgotPasswordEntity {
  private static schema = z.object({
    email: z.string().email(),// Email to which the reset link will be sent
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class ResetPasswordEntity {
  private static schema = z.object({
    token: z.string().uuid({ message: "Invalid reset token" }),// Reset token from link (UUID)
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}