import jwt, { JwtPayload } from 'jsonwebtoken'; 
import { randomBytes, randomUUID } from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';// Secret key for signing Access tokens

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface AccessTokenPayload extends JwtPayload, TokenPayload {
  jti: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  const jti = randomBytes(16).toString('hex');// Generate a unique jti token identifier - needed for Blacklist implementation
  
  const token = jwt.sign({ ...payload, jti }, ACCESS_SECRET, {
    expiresIn: '15m', 
  });
  
  return { token, jti };
};

export const generateRefreshTokenId = () => {
  return randomUUID(); 
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const result = jwt.verify(token, ACCESS_SECRET);

    if (typeof result === 'string') {
      return null;
    }

    return result as AccessTokenPayload;
  } catch {
    console.log('[JWT Error] Verification failed.');
    return null;
  }
};