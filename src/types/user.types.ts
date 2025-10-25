import mongoose from 'mongoose';

export type UserRole = 'normal_user' | 'librarian' | 'admin';
export type EmploymentStatus = 'employed' | 'unemployed' | 'vacation';

export interface TUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  employmentStatus?: EmploymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TUserDocument extends TUser, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
    employmentStatus?: EmploymentStatus;
  };
}

