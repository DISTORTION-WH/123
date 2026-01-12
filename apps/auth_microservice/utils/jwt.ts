import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET = process.env.JWT_SECRET || 'access-secret';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';

export interface TokenPayload extends jwt.JwtPayload {
  userId: string;
  role: string;
  email: string;
  jti: string;
  exp?: number; 
}

export const generateAccessToken = (payload: Omit<TokenPayload, 'jti' | 'exp' | 'iat'>) => {
  const jti = uuidv4();
  

  const token = jwt.sign(
    { ...payload, jti }, 
    ACCESS_SECRET as string, 
    { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions
  );
  
  return { token, jti };
};

export const generateRefreshTokenId = () => {
  return uuidv4();
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET as string) as TokenPayload;
  } catch (error) {
    return null;
  }
};