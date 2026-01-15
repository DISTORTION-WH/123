import jwt from 'jsonwebtoken';
import { randomBytes, randomUUID } from 'crypto'; // Импортируем всё из встроенного модуля

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  // randomBytes отлично подходит для создания случайной hex-строки (jti)
  const jti = randomBytes(16).toString('hex');
  
  const token = jwt.sign({ ...payload, jti }, ACCESS_SECRET, {
    expiresIn: '15m', 
  });
  
  return { token, jti };
};

export const generateRefreshTokenId = () => {
  // Используем нативный метод Node.js вместо библиотеки uuid
  return randomUUID(); 
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch (error: any) {
    console.log('[JWT Error] Verification failed.');
    return null;
  }
};