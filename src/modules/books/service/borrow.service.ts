import { BorrowRecordModel } from '../model/borrow-record.model';
import { BookModel } from '../model/book.model';
import {
  BorrowBookInput,
  ReturnBookInput,
  BorrowHistoryFilters,
  TBorrowRecord,
} from '@/types/borrowing.types';
import { NotFoundError, ValidationError } from '@/util/errors';
import { logger } from '@/util/logger';
import { config } from '@/config/env';
import { UserRole } from '@/types/user.types';

interface BorrowResponse {
  borrowId: string;
  bookId: string;
  userId: string;
  borrowedAt: Date;
  dueDate: Date;
  status: string;
}

interface ReturnResponse {
  returnedAt: Date;
  lateFee?: number;
  daysLate?: number;
}

export class BorrowService {
  private readonly MAX_BORROW_LIMIT = 5;
  private readonly DEFAULT_DURATION_DAYS = 14;

  async borrowBook(
    bookId: string,
    userId: string,
    input?: BorrowBookInput
  ): Promise<BorrowResponse> {
    try {
      // Check if book exists and is available
      const book = await BookModel.findById(bookId);
      if (!book) {
        throw new NotFoundError('Book not found');
      }

      if (book.status !== 'available') {
        throw new ValidationError('Book is not available for borrowing');
      }

      // Check if user has reached borrow limit
      const activeBorrows = await BorrowRecordModel.countDocuments({
        userId,
        status: { $in: ['pending', 'approved', 'active'] },
      });

      if (activeBorrows >= this.MAX_BORROW_LIMIT) {
        throw new ValidationError(
          `Cannot borrow more than ${this.MAX_BORROW_LIMIT} books at a time`
        );
      }

      // Create borrow record
      const durationDays = input?.durationDays || this.DEFAULT_DURATION_DAYS;
      const borrowedAt = new Date();
      const dueDate = new Date(borrowedAt);
      dueDate.setDate(dueDate.getDate() + durationDays);

      const borrowRecord = new BorrowRecordModel({
        bookId,
        userId,
        borrowedAt,
        dueDate,
        status: 'pending',
      });

      await borrowRecord.save();

      // Update book status
      book.status = 'borrowed';
      book.borrowedBy = userId;
      book.borrowedAt = borrowedAt;
      book.dueDate = dueDate;
      await book.save();

      return {
        borrowId: borrowRecord._id.toString(),
        bookId,
        userId,
        borrowedAt,
        dueDate,
        status: borrowRecord.status,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in borrowBook:', error);
      throw new Error('Failed to borrow book');
    }
  }

  async returnBook(
    bookId: string,
    userId: string,
    input?: ReturnBookInput
  ): Promise<ReturnResponse> {
    try {
      // Find active borrow record
      const borrowRecord = await BorrowRecordModel.findOne({
        bookId,
        userId,
        status: { $in: ['active', 'overdue', 'pending', 'approved'] },
      });

      if (!borrowRecord) {
        throw new NotFoundError('Active borrow record not found');
      }

      // Calculate late fee
      const returnedAt = new Date();
      const dueDate = new Date(borrowRecord.dueDate);
      let lateFee = 0;
      let daysLate = 0;

      if (returnedAt > dueDate) {
        const diffTime = returnedAt.getTime() - dueDate.getTime();
        daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        lateFee = daysLate * config.lateFeePerDay;
      }

      // Update borrow record
      borrowRecord.returnedAt = returnedAt;
      borrowRecord.status = 'returned';
      borrowRecord.condition = input?.condition || 'good';
      borrowRecord.lateFee = lateFee;
      borrowRecord.notes = input?.notes;
      await borrowRecord.save();

      // Update book status
      const book = await BookModel.findById(bookId);
      if (book) {
        if (input?.condition === 'damaged') {
          book.status = 'damaged';
        } else {
          book.status = 'available';
        }
        book.borrowedBy = undefined;
        book.borrowedAt = undefined;
        book.dueDate = undefined;
        await book.save();
      }

      return {
        returnedAt,
        lateFee: lateFee > 0 ? lateFee : undefined,
        daysLate: daysLate > 0 ? daysLate : undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in returnBook:', error);
      throw new Error('Failed to return book');
    }
  }

  async getBorrowHistory(
    currentUserId: string,
    userRole: UserRole,
    filters: BorrowHistoryFilters
  ): Promise<TBorrowRecord[]> {
    try {
      const query: Record<string, unknown> = {};

      // Normal users can only see their own history
      if (userRole === 'normal_user') {
        query.userId = currentUserId;
      } else if (filters.userId) {
        // Librarian/Admin can view specific user's history
        query.userId = filters.userId;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const records = await BorrowRecordModel.find(query)
        .populate('bookId')
        .lean();

      return records as TBorrowRecord[];
    } catch (error) {
      logger.error('Error in getBorrowHistory:', error);
      throw new Error('Failed to fetch borrow history');
    }
  }

  async approveBorrow(borrowId: string, approverId: string): Promise<TBorrowRecord> {
    try {
      const borrowRecord = await BorrowRecordModel.findById(borrowId);

      if (!borrowRecord) {
        throw new NotFoundError('Borrow record not found');
      }

      if (borrowRecord.status !== 'pending') {
        throw new ValidationError('Borrow request is not pending');
      }

      borrowRecord.status = 'active';
      borrowRecord.approvedBy = approverId;
      await borrowRecord.save();

      return borrowRecord.toObject() as TBorrowRecord;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error in approveBorrow:', error);
      throw new Error('Failed to approve borrow');
    }
  }
}

