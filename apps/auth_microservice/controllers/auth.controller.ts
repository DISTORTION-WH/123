import express, { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../schemas/auth.schema';

const router = express.Router();
const authService = new AuthService();

// регистрация нового пользователя
router
      .post('/register', async (req: Request, res: Response) => {
  try {
    // валидация в зод
    const validatedData = registerSchema.parse(req.body);
    // вызываем сервис из аус сервиса
    const result = await authService.registerUser(validatedData);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.issues });
    }
    return res.status(400).json({ error: error.message });
  }
})

// вход пользователя
      .post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body); // тоже валидируем
    
    const result = await authService.authenticateUser(validatedData); // тоже сервис
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.issues });
    }
    return res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
})

// рефреш
      .post('/refresh', async (req: Request, res: Response) => { // обновление токенов
  try {
    const { refreshTokenId } = req.body; // забираем токенайди из редиса 
    
    if (!refreshTokenId) {
      return res.status(400).json({ error: 'Refresh Token ID is required' }); // если не прислал токен - кик
    }

    const result = await authService.refreshTokens(refreshTokenId); // (существует ли токен, есть ли в блеклисте, генерация нового)
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
})

// валидация
      .post('/validate', async (req: Request, res: Response) => { 
  // когда пользователь шлет запрос, мы проверяем жизнеспособность токена
  try {
    let token = req.body.accessToken || req.body.token;
    // Если в body нет, проверяем заголовок 
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    const payload = await authService.validateToken(token);
    if (!payload) {
      return res.status(200).json({ valid: false, error: 'Invalid or expired token' });
    }
    return res.status(200).json({ 
        isValid: true, // кор проверяет это поле
        valid: true,
        userId: payload.userId, 
        email: payload.email,
        role: payload.role 
    });
  } catch (error) {
    console.error('Validation Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

// выход
      .post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshTokenId, accessToken } = req.body;
    await authService.logout(refreshTokenId, accessToken);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
})

// пароль забыли
    .post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
      return res.status(200).json({ 
      message: 'If an account with that email exists, we sent you a link to reset your password.' 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.issues });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
})

// сброс пароля
      .post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.issues });
    }
    return res.status(400).json({ error: error.message });
  }
});

export default router;