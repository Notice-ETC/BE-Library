import { Router } from 'express';
import { UserController } from '../controller/user.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';

const router = Router();
const userController = new UserController();

// All user management routes require admin role

// GET /users - Get all users with optional filters
router.get(
  '/',
  authMiddleware,
  requireRole(['admin']),
  userController.getUsers.bind(userController)
);

// PATCH /users/:userId/role - Update user role
router.patch(
  '/:userId/role',
  authMiddleware,
  requireRole(['admin']),
  userController.updateUserRole.bind(userController)
);

// PATCH /users/:userId/employment-status - Update employment status
router.patch(
  '/:userId/employment-status',
  authMiddleware,
  requireRole(['admin']),
  userController.updateEmploymentStatus.bind(userController)
);

export default router;

