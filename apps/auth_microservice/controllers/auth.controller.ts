import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const router = express.Router();
const authService = new AuthService();

// --- Схемы валидации Zod ---

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
  // Необязательные поля (Задача №4)
  displayName: z.string().optional(),
  birthday: z.string().optional(), // Можно добавить regex для даты, если нужно
  bio: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  newPassword: z.string().min(6),
});
// --- Роуты ---

/**
 * POST /register
 * Регистрация нового пользователя
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Валидация
    const validatedData = registerSchema.parse(req.body);
    
    // Вызов сервиса
    const result = await authService.registerUser(validatedData);
    
    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /login
 * Вход пользователя
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const result = await authService.authenticateUser(validatedData);
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    // Для безопасности лучше возвращать 401 на все ошибки логина
    return res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

/**
 * POST /refresh
 * Обновление пары токенов по refresh_token_id
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshTokenId } = req.body;
    
    if (!refreshTokenId) {
      return res.status(400).json({ error: 'Refresh Token ID is required' });
    }

    const result = await authService.refreshTokens(refreshTokenId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

/**
 * POST /validate
 * Проверка валидности access токена (вызывается из Gateway/Core)
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    // Ожидаем токен в заголовке Authorization: Bearer <token> или в body
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1] ? authHeader.split(' ')[1] : req.body.token;

    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const payload = await authService.validateToken(token);
    
    if (!payload) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }

    return res.status(200).json({ valid: true, user: payload });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /logout
 * Выход из системы
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshTokenId, accessToken } = req.body;
    
    await authService.logout(refreshTokenId, accessToken);
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
// --- НОВЫЕ РОУТЫ ---

/**
 * POST /forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    await authService.forgotPassword(email);
    
    // Всегда возвращаем 200 OK, даже если email не найден (Security)
    return res.status(200).json({ 
      message: 'If an account with that email exists, we sent you a link to reset your password.' 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /reset-password
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    
    const result = await authService.resetPassword(token, newPassword);
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    // Если токен невалиден или просрочен
    return res.status(400).json({ error: error.message });
  }
});
export default router;