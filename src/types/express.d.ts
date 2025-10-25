import { Request } from 'express';

export type UserRole = 'normal_user' | 'librarian' | 'admin';
export type EmploymentStatus = 'employed' | 'unemployed' | 'vacation';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

