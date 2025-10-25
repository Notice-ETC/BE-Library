import { UserModel } from '../model/user.model';
import { RegisterInput, AuthResponse } from '@/types/user.types';
import { ValidationError, UnauthorizedError } from '@/util/errors';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { logger } from '@/util/logger';

export class AuthService {
  // Debug method to check user data
  async debugUser(email: string): Promise<{
    found: boolean;
    user?: {
      id: string;
      username: string;
      email: string;
      role: string;
      hasPassword: boolean;
    };
  }> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return { found: false };
      }

      return {
        found: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          hasPassword: !!user.password,
        },
      };
    } catch (error) {
      logger.error('Error in debugUser:', error);
      throw error;
    }
  }
  async register(data: RegisterInput): Promise<{
    userId: string;
    username: string;
    email: string;
    role: string;
  }> {
    try {
      // Check if email already exists
      const existingUser = await UserModel.findOne({ email: data.email });
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }

      // Create new user
      const user = new UserModel({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: 'normal_user',
      });

      const savedUser = await user.save();

      return {
        userId: savedUser._id.toString(),
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in register:', error);
      throw new Error('Failed to register user');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      logger.info(`Attempting login for email: ${email}`);
      
      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        logger.warn(`Login failed: User not found for email: ${email}`);
        throw new UnauthorizedError('Invalid credentials');
      }

      logger.info(`User found: ${user.username}, checking password...`);

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login failed: Invalid password for email: ${email}`);
        throw new UnauthorizedError('Invalid credentials');
      }

      logger.info(`Login successful for user: ${user.username}`);

      // Generate JWT token
      const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      
      // Note: Using type assertion here due to jsonwebtoken's StringValue branded type
      // This is a known limitation with the library's type definitions
      const jwtOptions = {
        expiresIn: config.jwtExpiresIn,
      };
      const token = jwt.sign(payload, config.jwtSecret, jwtOptions as jwt.SignOptions);

      return {
        token,
        user: {
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          employmentStatus: user.employmentStatus,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error('Error in login:', error);
      throw new Error('Failed to login');
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    try {
      // In a stateless JWT system, logout is typically handled on the client side
      // by removing the token from storage. However, we can add server-side logic
      // for token blacklisting if needed in the future.
      
      logger.info(`User logout requested for token: ${token.substring(0, 20)}...`);
      
      // For now, we'll just return a success message
      // In a production system, you might want to:
      // 1. Add token to a blacklist
      // 2. Store logout timestamp
      // 3. Invalidate refresh tokens if using them
      
      return {
        message: 'Logout successful'
      };
    } catch (error) {
      logger.error('Error in logout:', error);
      throw new Error('Failed to logout');
    }
  }
}

