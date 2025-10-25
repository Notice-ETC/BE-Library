import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';

const router = Router();
const authController = new AuthController();

// POST /auth/register
router.post('/register', authController.register.bind(authController));

// POST /auth/login
router.post('/login', authController.login.bind(authController));

// POST /auth/logout
router.post('/logout', authController.logout.bind(authController));

// GET /auth/debug-user?email=test@example.com
router.get('/debug-user', authController.debugUser.bind(authController));

export default router;

