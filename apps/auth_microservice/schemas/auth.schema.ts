import { z } from 'zod';

// Схема для Регистрации
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z.string().min(3, "Username must be at least 3 chars").max(30),
    password: z.string().min(6, "Password must be at least 6 chars"),
    displayName: z.string().optional(),
    birthday: z.string().optional(), // Можно добавить валидацию даты .date() или regex
    bio: z.string().max(300).optional(),
  }),
});

// Схема для Логина
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

// Схема для Обновления токенов
export const refreshSchema = z.object({
  body: z.object({
    refreshTokenId: z.string().uuid({ message: "Invalid refresh token format" }),
  }),
});

// Схема для Валидации токена
export const validateTokenSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, "Access token is required"),
  }),
});

// Схема для Выхода (Logout)
export const logoutSchema = z.object({
  body: z.object({
    refreshTokenId: z.string().uuid(),
    accessToken: z.string().optional(),
  }),
});

// Схема для "Забыл пароль"
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// Схема для Сброса пароля
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().uuid({ message: "Invalid reset token" }),
    newPassword: z.string().min(6, "Password must be at least 6 chars"),
  }),
});