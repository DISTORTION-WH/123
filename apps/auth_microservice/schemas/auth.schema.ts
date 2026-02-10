import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z.string().min(3, "Username must be at least 3 chars").max(30),
    password: z.string().min(6, "Password must be at least 6 chars"),
    displayName: z.string().optional(),
    birthday: z.string().optional(),
    bio: z.string().max(300).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshTokenId: z.string().uuid({ message: "Invalid refresh token format" }),
  }),
});

export const validateTokenSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, "Access token is required"),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshTokenId: z.string().uuid(),
    accessToken: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().uuid({ message: "Invalid reset token" }),
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
  }),
});