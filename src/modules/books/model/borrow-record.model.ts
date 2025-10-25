import mongoose, { Schema } from 'mongoose';
import { TBorrowRecordDocument } from '@/types/borrowing.types';

const BorrowRecordSchema = new Schema<TBorrowRecordDocument>(
  {
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    borrowedAt: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    returnedAt: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'returned', 'overdue'],
      default: 'pending',
      required: true,
      index: true,
    },
    approvedBy: {
      type: String,
      required: false,
    },
    condition: {
      type: String,
      enum: ['good', 'damaged'],
      required: false,
    },
    lateFee: {
      type: Number,
      required: false,
      default: 0,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
BorrowRecordSchema.index({ userId: 1, status: 1 });
BorrowRecordSchema.index({ bookId: 1, status: 1 });

export const BorrowRecordModel = mongoose.model<TBorrowRecordDocument>(
  'BorrowRecord',
  BorrowRecordSchema
);

