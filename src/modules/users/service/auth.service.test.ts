import { AuthService } from './auth.service';
import { UserModel } from '../model/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';
import { ValidationError, UnauthorizedError } from '../../../util/errors';

// Mock dependencies
jest.mock('../model/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const mockUser = {
        _id: 'user123',
        ...registerData,
        role: 'normal_user',
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashedpassword',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.prototype.save as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
      (UserModel as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockUser),
      }));

      const result = await authService.register(registerData);

      expect(result.userId).toBe('user123');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('normal_user');
    });

    it('should throw ValidationError if email already exists', async () => {
      const registerData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' });

      await expect(authService.register(registerData)).rejects.toThrow(ValidationError);
      await expect(authService.register(registerData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        fullName: 'Test User',
        role: 'normal_user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginData.email, loginData.password);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.userId).toBe('user123');
      expect(result.user.email).toBe('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 'user123',
          email: 'test@example.com',
          role: 'normal_user',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('notfound@example.com', 'password123')).rejects.toThrow(
        UnauthorizedError
      );
      await expect(authService.login('notfound@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedError
      );
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });
});

