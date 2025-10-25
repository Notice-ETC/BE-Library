import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/util/errors';
import { config } from '@/config/env';
import { AuthUser, UserRole } from '@/types/express';

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    if (token === authHeader) {
      // Bearer prefix not found
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    } as AuthUser;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid token'));
    }
  }
};

