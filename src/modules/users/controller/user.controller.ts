import { Request, Response, NextFunction } from 'express';
import { UserService } from '../service/user.service';
import { responseWrapper } from '@/util/responseWrapper';
import { z } from 'zod';
import { ValidationError } from '@/util/errors';

// Zod validation schemas
const getUsersQuerySchema = z.object({
  role: z.enum(['normal_user', 'librarian', 'admin']).optional(),
  employmentStatus: z.enum(['employed', 'unemployed', 'vacation']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['normal_user', 'librarian', 'admin']),
});

const updateEmploymentStatusSchema = z.object({
  employmentStatus: z.enum(['employed', 'unemployed', 'vacation']),
});

export class UserController {
  private userService = new UserService();

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = getUsersQuerySchema.parse(req.query);
      const users = await this.userService.getUsers(validatedQuery);

      res.json(responseWrapper.success(users));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const validatedData = updateRoleSchema.parse(req.body);

      const user = await this.userService.updateUserRole(userId, validatedData.role);

      res.json(responseWrapper.success(user, 'User role updated successfully'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async updateEmploymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const validatedData = updateEmploymentStatusSchema.parse(req.body);

      const user = await this.userService.updateEmploymentStatus(
        userId,
        validatedData.employmentStatus
      );

      res.json(
        responseWrapper.success(user, 'Employment status updated successfully')
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }
}

