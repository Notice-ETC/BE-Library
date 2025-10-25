import { UserModel } from '../model/user.model';
import { UserRole, EmploymentStatus } from '@/types/user.types';
import { NotFoundError, ValidationError } from '@/util/errors';
import { logger } from '@/util/logger';

interface UserFilters {
  role?: UserRole;
  employmentStatus?: EmploymentStatus;
}

interface UserResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  employmentStatus?: EmploymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  async getUsers(filters: UserFilters): Promise<UserResponse[]> {
    try {
      const query: Record<string, unknown> = {};

      if (filters.role) {
        query.role = filters.role;
      }

      if (filters.employmentStatus) {
        query.employmentStatus = filters.employmentStatus;
      }

      const users = await UserModel.find(query)
        .select('-password')
        .lean();

      return users.map((user) => ({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employmentStatus: user.employmentStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      logger.error('Error in getUsers:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserResponse> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.role = role;

      // Set employment status for librarian/admin roles
      if (role === 'librarian' || role === 'admin') {
        user.employmentStatus = 'employed';
      }

      await user.save();

      return {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employmentStatus: user.employmentStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in updateUserRole:', error);
      throw new Error('Failed to update user role');
    }
  }

  async updateEmploymentStatus(
    userId: string,
    employmentStatus: EmploymentStatus
  ): Promise<UserResponse> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Only librarian and admin can have employment status
      if (user.role !== 'librarian' && user.role !== 'admin') {
        throw new ValidationError(
          'Employment status only applies to librarian and admin roles'
        );
      }

      user.employmentStatus = employmentStatus;
      await user.save();

      return {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employmentStatus: user.employmentStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in updateEmploymentStatus:', error);
      throw new Error('Failed to update employment status');
    }
  }
}

