import { Router } from 'express';
import { BorrowController } from '../controller/borrow.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';

const router = Router();
const borrowController = new BorrowController();

// GET /borrowing/history - Get borrow history
router.get(
  '/history',
  authMiddleware,
  borrowController.getBorrowHistory.bind(borrowController)
);

// PATCH /borrowing/:borrowId/approve - Approve borrow (librarian, admin)
router.patch(
  '/:borrowId/approve',
  authMiddleware,
  requireRole(['librarian', 'admin']),
  borrowController.approveBorrow.bind(borrowController)
);

export default router;

