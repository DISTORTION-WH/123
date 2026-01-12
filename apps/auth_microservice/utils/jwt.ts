import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  // Генерируем access token (живет 15 минут)
  // jti (JWT ID) нужен для возможности добавить токен в черный список
  const jti = require('crypto').randomBytes(16).toString('hex');
  
  const token = jwt.sign({ ...payload, jti }, ACCESS_SECRET, {
    expiresIn: '15m', 
  });
  
  return { token, jti };
};

export const generateRefreshTokenId = () => {
  // Refresh token у нас будет просто UUID (опак токен), который мы храним в Redis
  return require('uuid').v4(); 
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch (error: any) {
    // --- ЛОГИРОВАНИЕ ОШИБКИ ---
    console.log('------------------------------------------------');
    console.log('[JWT Error] Verification failed for token:');
    console.log(token.substring(0, 20) + '...'); // Показываем начало токена
    console.log('Reason:', error.message); // <--- Самое важное: причина ошибки
    console.log('Using Secret:', ACCESS_SECRET); 
    console.log('------------------------------------------------');
    return null;
  }
};