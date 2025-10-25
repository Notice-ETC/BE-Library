import mongoose, { Schema } from 'mongoose';
import { TUserDocument } from '@/types/user.types';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema<TUserDocument>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['normal_user', 'librarian', 'admin'],
      default: 'normal_user',
      required: true,
      index: true,
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'vacation'],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const UserModel = mongoose.model<TUserDocument>('User', UserSchema);

