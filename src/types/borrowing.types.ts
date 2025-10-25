import mongoose from 'mongoose';

export type BorrowStatus = 'pending' | 'approved' | 'active' | 'returned' | 'overdue';
export type BookCondition = 'good' | 'damaged';

export interface TBorrowRecord {
  bookId: string;
  userId: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  status: BorrowStatus;
  approvedBy?: string;
  condition?: BookCondition;
  lateFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TBorrowRecordDocument extends TBorrowRecord, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export interface BorrowBookInput {
  durationDays?: number;
}

export interface ReturnBookInput {
  condition?: BookCondition;
  notes?: string;
}

export interface BorrowHistoryFilters {
  userId?: string;
  status?: string;
}

