import { BorrowService } from './borrow.service';
import { BorrowRecordModel } from '../model/borrow-record.model';
import { BookModel } from '../model/book.model';
import { NotFoundError, ValidationError } from '../../../util/errors';

jest.mock('../model/borrow-record.model');
jest.mock('../model/book.model');

describe('BorrowService', () => {
  let borrowService: BorrowService;

  beforeEach(() => {
    jest.clearAllMocks();
    borrowService = new BorrowService();
  });

  describe('borrowBook', () => {
    it('should borrow book successfully', async () => {
      const mockBook = {
        _id: 'book123',
        title: 'Book 1',
        status: 'available',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      const mockBorrowRecord = {
        _id: 'borrow123',
        bookId: 'book123',
        userId: 'user123',
        status: 'pending',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);
      (BorrowRecordModel.countDocuments as jest.Mock).mockResolvedValue(2);
      (BorrowRecordModel as unknown as jest.Mock).mockImplementation(
        () => mockBorrowRecord
      );

      const result = await borrowService.borrowBook('book123', 'user123');

      expect(mockBook.status).toBe('borrowed');
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundError if book not found', async () => {
      (BookModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(borrowService.borrowBook('nonexistent', 'user123')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError if book not available', async () => {
      const mockBook = {
        _id: 'book123',
        status: 'borrowed',
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      await expect(borrowService.borrowBook('book123', 'user123')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError if user reached borrow limit', async () => {
      const mockBook = {
        _id: 'book123',
        status: 'available',
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);
      (BorrowRecordModel.countDocuments as jest.Mock).mockResolvedValue(5);

      await expect(borrowService.borrowBook('book123', 'user123')).rejects.toThrow(
        ValidationError
      );
      await expect(borrowService.borrowBook('book123', 'user123')).rejects.toThrow(
        'Cannot borrow more than 5 books at a time'
      );
    });
  });

  describe('returnBook', () => {
    it('should return book successfully without late fee', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockBorrowRecord = {
        _id: 'borrow123',
        bookId: 'book123',
        userId: 'user123',
        status: 'active',
        dueDate: tomorrow,
        lateFee: 0,
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      const mockBook = {
        _id: 'book123',
        status: 'borrowed',
        borrowedBy: 'user123',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      (BorrowRecordModel.findOne as jest.Mock).mockResolvedValue(mockBorrowRecord);
      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      const result = await borrowService.returnBook('book123', 'user123', {
        condition: 'good',
      });

      expect(mockBorrowRecord.status).toBe('returned');
      expect(mockBook.status).toBe('available');
      expect(result.lateFee).toBeUndefined();
    });

    it('should calculate late fee correctly', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const mockBorrowRecord = {
        _id: 'borrow123',
        bookId: 'book123',
        userId: 'user123',
        status: 'overdue',
        dueDate: threeDaysAgo,
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      const mockBook = {
        _id: 'book123',
        status: 'borrowed',
        borrowedBy: 'user123',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      (BorrowRecordModel.findOne as jest.Mock).mockResolvedValue(mockBorrowRecord);
      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      const result = await borrowService.returnBook('book123', 'user123', {
        condition: 'good',
      });

      expect(result.lateFee).toBe(30); // 3 days * 10 baht
      expect(result.daysLate).toBe(3);
    });

    it('should update book status to damaged if condition is damaged', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockBorrowRecord = {
        _id: 'borrow123',
        bookId: 'book123',
        userId: 'user123',
        status: 'active',
        dueDate: tomorrow,
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      const mockBook = {
        _id: 'book123',
        status: 'borrowed',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
      };

      (BorrowRecordModel.findOne as jest.Mock).mockResolvedValue(mockBorrowRecord);
      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      await borrowService.returnBook('book123', 'user123', {
        condition: 'damaged',
      });

      expect(mockBook.status).toBe('damaged');
    });
  });

  describe('getBorrowHistory', () => {
    it('should return user own history', async () => {
      const mockRecords = [
        {
          _id: 'borrow1',
          bookId: 'book1',
          userId: 'user123',
          status: 'returned',
        },
      ];

      (BorrowRecordModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRecords),
        }),
      });

      const result = await borrowService.getBorrowHistory('user123', 'normal_user', {});

      expect(BorrowRecordModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(result).toEqual(mockRecords);
    });

    it('should allow admin to view all history', async () => {
      const mockRecords = [
        {
          _id: 'borrow1',
          bookId: 'book1',
          userId: 'user456',
          status: 'active',
        },
      ];

      (BorrowRecordModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRecords),
        }),
      });

      const result = await borrowService.getBorrowHistory('user123', 'admin', {
        userId: 'user456',
      });

      expect(BorrowRecordModel.find).toHaveBeenCalledWith({ userId: 'user456' });
      expect(result).toEqual(mockRecords);
    });

    it('should filter by status', async () => {
      const mockRecords: any[] = [];

      (BorrowRecordModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRecords),
        }),
      });

      await borrowService.getBorrowHistory('user123', 'admin', { status: 'active' });

      expect(BorrowRecordModel.find).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('approveBorrow', () => {
    it('should approve borrow successfully', async () => {
      const mockBorrowRecord = {
        _id: 'borrow123',
        status: 'pending',
        approvedBy: undefined,
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBorrowRecord,
        }),
        toObject: jest.fn().mockReturnValue({
          _id: 'borrow123',
          status: 'pending',
          approvedBy: undefined,
        }),
      };

      (BorrowRecordModel.findById as jest.Mock).mockResolvedValue(mockBorrowRecord);

      await borrowService.approveBorrow('borrow123', 'librarian123');

      expect(mockBorrowRecord.status).toBe('active');
      expect(mockBorrowRecord.approvedBy).toBe('librarian123');
    });

    it('should throw NotFoundError if borrow record not found', async () => {
      (BorrowRecordModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        borrowService.approveBorrow('nonexistent', 'librarian123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if already approved', async () => {
      const mockBorrowRecord = {
        _id: 'borrow123',
        status: 'active',
      };

      (BorrowRecordModel.findById as jest.Mock).mockResolvedValue(mockBorrowRecord);

      await expect(
        borrowService.approveBorrow('borrow123', 'librarian123')
      ).rejects.toThrow(ValidationError);
    });
  });
});

