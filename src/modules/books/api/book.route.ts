import { Router } from 'express';
import { BookController } from '../controller/book.controller';
import { BorrowController } from '../controller/borrow.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';

const router = Router();
const bookController = new BookController();
const borrowController = new BorrowController();

// GET /bookshelf - Get all books (all roles)
router.get('/', bookController.getBooks.bind(bookController));

// GET /bookshelf/:bookId - Get book by id (all roles)
router.get('/:bookId', bookController.getBookById.bind(bookController));

// POST /bookshelf - Create book (admin only)
router.post(
  '/',
  authMiddleware,
  requireRole(['admin']),
  bookController.createBook.bind(bookController)
);

// POST /bookshelf/:bookId/borrow - Borrow book (all authenticated users)
router.post(
  '/:bookId/borrow',
  authMiddleware,
  borrowController.borrowBook.bind(borrowController)
);

// POST /bookshelf/:bookId/return - Return book (all authenticated users)
router.post(
  '/:bookId/return',
  authMiddleware,
  borrowController.returnBook.bind(borrowController)
);

// PATCH /bookshelf/:bookId/status - Update book status (librarian, admin)
router.patch(
  '/:bookId/status',
  authMiddleware,
  requireRole(['librarian', 'admin']),
  bookController.updateBookStatus.bind(bookController)
);

// DELETE /bookshelf/:bookId - Delete book (admin only)
router.delete(
  '/:bookId',
  authMiddleware,
  requireRole(['admin']),
  bookController.deleteBook.bind(bookController)
);

export default router;

