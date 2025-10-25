import { Request, Response, NextFunction } from 'express';
import { BookService } from '../service/book.service';
import { responseWrapper } from '@/util/responseWrapper';
import { z } from 'zod';
import { ValidationError } from '@/util/errors';

// Zod validation schemas
const getBooksQuerySchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(['available', 'borrowed', 'damaged', 'importing', 'lost']).optional(),
  category: z.string().optional(),
  minPages: z.coerce.number().positive().optional(),
  maxPages: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
});

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  isbn: z.string().min(1),
  category: z.string().min(1).max(50),
  pageCount: z.number().positive(),
  publishedYear: z.number().min(1000).max(new Date().getFullYear() + 10),
  status: z.enum(['available', 'importing']).optional(),
  quantity: z.number().positive().max(100).optional(),
});

const updateBookStatusSchema = z.object({
  status: z.enum(['available', 'borrowed', 'damaged', 'importing', 'lost']),
  reason: z.string().optional(),
});

export class BookController {
  private bookService = new BookService();

  async getBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = getBooksQuerySchema.parse(req.query);
      const result = await this.bookService.getBooks(validatedQuery);

      res.json(responseWrapper.success(result));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const book = await this.bookService.getBookById(bookId);

      res.json(responseWrapper.success(book));
    } catch (error: unknown) {
      next(error);
    }
  }

  async createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createBookSchema.parse(req.body);
      const books = await this.bookService.createBook(validatedData);

      res.status(201).json(
        responseWrapper.success(
          books,
          `${books.length} book(s) created successfully`
        )
      );
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async updateBookStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { bookId } = req.params;
      const validatedData = updateBookStatusSchema.parse(req.body);

      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const book = await this.bookService.updateBookStatus(
        bookId,
        validatedData.status,
        req.user.role
      );

      res.json(responseWrapper.success(book, 'Book status updated successfully'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues));
      } else {
        next(error);
      }
    }
  }

  async deleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      await this.bookService.deleteBook(bookId);

      res.json(responseWrapper.success(null, 'Book deleted successfully'));
    } catch (error: unknown) {
      next(error);
    }
  }
}

