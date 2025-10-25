import { Request, Response, NextFunction } from 'express';
import { BorrowService } from '../service/borrow.service';
import { responseWrapper } from '@/util/responseWrapper';
import { z } from 'zod';
import { ValidationError } from '@/util/errors';

// Zod validation schemas
const borrowBookSchema = z.object({
  durationDays: z.number().positive().max(90).optional(),
});

const returnBookSchema = z.object({
  condition: z.enum(['good', 'damaged']).optional(),
  notes: z.string().max(500).optional(),
});

const getBorrowHistoryQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'active', 'returned', 'overdue']).optional(),
});

export class BorrowController {
  private borrowService = new BorrowService();

  async borrowBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const validatedData = borrowBookSchema.parse(req.body);

      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.borrowService.borrowBook(
        bookId,
        req.user.userId,
        validatedData
      );

      res.status(201).json(
        responseWrapper.success(result, 'Book borrowed successfully')
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async returnBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const validatedData = returnBookSchema.parse(req.body);

      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.borrowService.returnBook(
        bookId,
        req.user.userId,
        validatedData
      );

      res.json(responseWrapper.success(result, 'Book returned successfully'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async getBorrowHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedQuery = getBorrowHistoryQuerySchema.parse(req.query);

      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.borrowService.getBorrowHistory(
        req.user.userId,
        req.user.role,
        validatedQuery
      );

      res.json(responseWrapper.success(result));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async approveBorrow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { borrowId } = req.params;

      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.borrowService.approveBorrow(
        borrowId,
        req.user.userId
      );

      res.json(responseWrapper.success(result, 'Borrow request approved'));
    } catch (error: unknown) {
      next(error);
    }
  }
}

