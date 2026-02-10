import { z } from 'zod';


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
    refreshTokenId: z.string().uuid(),
    accessToken: z.string().optional(),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class ForgotPasswordEntity {
  private static schema = z.object({
    email: z.string().email(),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}


export class ResetPasswordEntity {
  private static schema = z.object({
    token: z.string().uuid({ message: "Invalid reset token" }),
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
  });

  static validate(data: unknown) {
    return this.schema.parse(data);
  }
}