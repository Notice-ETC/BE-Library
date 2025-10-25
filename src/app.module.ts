import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler } from '@/util/errorHandler';
import authRoutes from '@/modules/users/api/auth.route';
import userRoutes from '@/modules/users/api/user.route';
import bookRoutes from '@/modules/books/api/book.route';
import borrowRoutes from '@/modules/books/api/borrow.route';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/bookshelf', bookRoutes);
  app.use('/borrowing', borrowRoutes);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};

