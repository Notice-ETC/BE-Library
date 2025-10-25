import { BookService } from './book.service';
import { BookModel } from '../model/book.model';
import { NotFoundError, ForbiddenError } from '../../../util/errors';

jest.mock('../model/book.model');

describe('BookService', () => {
  let bookService: BookService;

  beforeEach(() => {
    jest.clearAllMocks();
    bookService = new BookService();
  });

  describe('getBooks', () => {
    it('should return books without filters', async () => {
      const mockBooks = [
        {
          _id: 'book1',
          title: 'Book 1',
          author: 'Author 1',
          status: 'available',
          category: 'fiction',
        },
      ];

      (BookModel.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBooks),
          }),
        }),
      });

      (BookModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await bookService.getBooks({});

      expect(result.books).toEqual(mockBooks);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should return books with filters', async () => {
      const mockBooks = [
        {
          _id: 'book1',
          title: 'Book 1',
          author: 'Author 1',
          status: 'available',
          category: 'fiction',
        },
      ];

      (BookModel.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBooks),
          }),
        }),
      });

      (BookModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await bookService.getBooks({
        status: 'available',
        category: 'fiction',
      });

      expect(BookModel.find).toHaveBeenCalledWith({
        status: 'available',
        category: 'fiction',
      });
      expect(result.books).toEqual(mockBooks);
    });

    it('should handle pagination correctly', async () => {
      const mockBooks = [{}, {}];

      (BookModel.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockBooks),
          }),
        }),
      });

      (BookModel.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await bookService.getBooks({ page: 2, limit: 10 });

      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.totalItems).toBe(25);
      expect(result.pagination.itemsPerPage).toBe(10);
    });
  });

  describe('getBookById', () => {
    it('should return book by id', async () => {
      const mockBook = {
        _id: 'book123',
        title: 'Book 1',
        author: 'Author 1',
        status: 'available',
      };

      (BookModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockBook),
      });

      const result = await bookService.getBookById('book123');

      expect(BookModel.findById).toHaveBeenCalledWith('book123');
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundError if book not found', async () => {
      (BookModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(bookService.getBookById('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createBook', () => {
    it('should create a single book', async () => {
      const mockBook = {
        _id: 'book123',
        title: 'New Book',
        author: 'Author',
        isbn: '123456',
        status: 'importing',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBook,
        }),
        toObject: jest.fn().mockReturnValue({
          _id: 'book123',
          title: 'New Book',
          author: 'Author',
          isbn: '123456',
          status: 'importing',
        }),
      };

      (BookModel as unknown as jest.Mock).mockImplementation(() => mockBook);

      const result = await bookService.createBook({
        title: 'New Book',
        author: 'Author',
        isbn: '123456',
        category: 'fiction',
        pageCount: 200,
        publishedYear: 2023,
      });

      expect(result.length).toBe(1);
      expect(mockBook.save).toHaveBeenCalled();
    });

    it('should create multiple books when quantity is specified', async () => {
      const mockBook = {
        _id: 'book123',
        title: 'New Book',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBook,
        }),
        toObject: jest.fn().mockReturnValue({
          _id: 'book123',
          title: 'New Book',
        }),
      };

      (BookModel as unknown as jest.Mock).mockImplementation(() => mockBook);

      const result = await bookService.createBook({
        title: 'New Book',
        author: 'Author',
        isbn: '123456',
        category: 'fiction',
        pageCount: 200,
        publishedYear: 2023,
        quantity: 3,
      });

      expect(result.length).toBe(3);
    });
  });

  describe('updateBookStatus', () => {
    it('should allow librarian to update to available', async () => {
      const mockBook = {
        _id: 'book123',
        status: 'importing',
        save: jest.fn().mockResolvedValue({
          toObject: () => ({ ...mockBook, status: mockBook.status }),
        }),
        toObject: jest.fn().mockReturnValue({
          _id: 'book123',
          status: 'available',
        }),
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      const result = await bookService.updateBookStatus(
        'book123',
        'available',
        'librarian'
      );

      expect(mockBook.status).toBe('available');
      expect(mockBook.save).toHaveBeenCalled();
      expect(result.status).toBe('available');
    });

    it('should allow admin to update to any status', async () => {
      const mockBook = {
        _id: 'book123',
        status: 'available',
        save: jest.fn().mockResolvedValue({
          toObject: () => mockBook,
        }),
        toObject: jest.fn().mockReturnValue({
          _id: 'book123',
          status: 'lost',
        }),
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      const result = await bookService.updateBookStatus('book123', 'lost', 'admin');

      expect(mockBook.status).toBe('lost');
      expect(result.status).toBe('lost');
    });

    it('should throw ForbiddenError if librarian tries to set importing/lost', async () => {
      const mockBook = {
        _id: 'book123',
        status: 'available',
      };

      (BookModel.findById as jest.Mock).mockResolvedValue(mockBook);

      await expect(
        bookService.updateBookStatus('book123', 'lost', 'librarian')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if book not found', async () => {
      (BookModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        bookService.updateBookStatus('nonexistent', 'available', 'admin')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteBook', () => {
    it('should delete book successfully', async () => {
      const mockBook = {
        _id: 'book123',
        title: 'Book to delete',
      };

      (BookModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockBook);

      await bookService.deleteBook('book123');

      expect(BookModel.findByIdAndDelete).toHaveBeenCalledWith('book123');
    });

    it('should throw NotFoundError if book not found', async () => {
      (BookModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(bookService.deleteBook('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

