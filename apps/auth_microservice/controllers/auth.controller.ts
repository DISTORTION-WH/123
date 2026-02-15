import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { ZodError } from 'zod';
import { AuthService } from '../services/auth.service';
import {
  RegisterEntity,
  LoginEntity,
  RefreshTokenEntity,
  ValidateTokenEntity,
  LogoutEntity,
  ForgotPasswordEntity,
  ResetPasswordEntity
} from '../dtos/auth.dto';

const router: ExpressRouter = Router();
const authService = new AuthService();

const handleControllerError = (res: Response, error: unknown) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return res.status(400).json({ error: message });
};

router
      .post('/register', async (req: Request, res: Response) => {
  try {
    // Validate the incoming request body via the Zod scheme for registration
    const dto = RegisterEntity.validate(req.body);
    // Calling the registration service hashing the password, creating a user in the database, generating tokens
    const result = await authService.registerUser(dto);
    
    return res.status(201).json(result);
  } catch (error: unknown) {
    return handleControllerError(res, error);
  }
})

    .post('/login', async (req: Request, res: Response) => {
  try {
    console.log('[Login] Received credentials:', { email: req.body.email });
    const dto = LoginEntity.validate(req.body);
    console.log('[Login] Validation passed');
    const result = await authService.authenticateUser(dto);
    console.log('[Login] Authentication successful for:', dto.email);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid credentials';
    console.log('[Login] Error:', message);
    if (error instanceof ZodError) return handleControllerError(res, error);
    return res.status(401).json({ error: message });
  }
})

      .post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshTokenId } = RefreshTokenEntity.validate(req.body);
    const result = await authService.refreshTokens(refreshTokenId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) return handleControllerError(res, error);
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return res.status(401).json({ error: message });
  }
})

      .post('/validate', async (req: Request, res: Response) => {
  try {
    // Check the request structure for the presence of an accessToken
    const { accessToken } = ValidateTokenEntity.validate(req.body);
// Check token validity (signature, expiration date, blacklist)
    const payload = await authService.validateToken(accessToken);

    if (!payload) {
      console.log('[Validate] Invalid or expired token');
      return res.status(200).json({
        isValid: false,
        valid: false,
        error: 'Invalid or expired token'
      });
    }

    console.log('[Validate] Token valid for user:', payload.userId);
    return res.status(200).json({
        isValid: true,
        valid: true,
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Validate] Error:', message);
    if (error instanceof ZodError) return handleControllerError(res, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

      .post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshTokenId, accessToken } = LogoutEntity.validate(req.body);
    await authService.logout(refreshTokenId, accessToken);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    return handleControllerError(res, error);
  }
})

        .post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = ForgotPasswordEntity.validate(req.body);
    await authService.forgotPassword(email);
    return res.status(200).json({
      message: 'If an account with that email exists, we sent you a link to reset your password.'
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) return handleControllerError(res, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

      .post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = ResetPasswordEntity.validate(req.body);
    const result = await authService.resetPassword(token, newPassword);
    return res.status(200).json(result);
  } catch (error: unknown) {
    return handleControllerError(res, error);
  }
});

export default router;