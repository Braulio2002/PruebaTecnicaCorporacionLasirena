import jwt, { JwtPayload, Secret, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw createError(401, 'Token de acceso requerido', 'MISSING_TOKEN');
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw createError(500, 'JWT secret not configured', 'JWT_CONFIG_ERROR');
    }

    const decoded = jwt.verify(token, JWT_SECRET as Secret) as JwtPayload & {
      id: string;
      email: string;
      role: string;
    };

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(createError(401, 'Token expirado', 'TOKEN_EXPIRED'));
    }
    if (err instanceof JsonWebTokenError) {
      return next(createError(403, 'Token inválido', 'INVALID_TOKEN'));
    }
    next(err);
  }
};
