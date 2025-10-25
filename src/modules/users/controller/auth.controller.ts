import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import { responseWrapper } from '@/util/responseWrapper';
import { z } from 'zod';
import { ValidationError } from '@/util/errors';

// Zod validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      const result = await this.authService.register(validatedData);

      res.status(201).json(
        responseWrapper.success(result, 'User registered successfully')
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      const result = await this.authService.login(
        validatedData.email,
        validatedData.password
      );

      res.json(responseWrapper.success(result, 'Login successful'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  // Debug endpoint to check user data
  async debugUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        res.status(400).json(
          responseWrapper.error('Email parameter is required', 'VALIDATION_ERROR')
        );
        return;
      }

      const result = await this.authService.debugUser(email);
      
      res.json(responseWrapper.success(result, 'Debug user data retrieved'));
    } catch (error: unknown) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(
          responseWrapper.error('Authorization token required', 'UNAUTHORIZED')
        );
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      const result = await this.authService.logout(token);
      
      res.json(responseWrapper.success(result, 'Logout successful'));
    } catch (error: unknown) {
      next(error);
    }
  }
}

