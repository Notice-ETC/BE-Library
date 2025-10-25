import { BookModel } from '../model/book.model';
import { BookFilters, CreateBookInput, BookStatus, TBook } from '@/types/book.types';
import { NotFoundError, ForbiddenError } from '@/util/errors';
import { logger } from '@/util/logger';
import { PaginationResult } from '@/types/common.types';
import { UserRole } from '@/types/user.types';

interface BooksWithPagination {
  books: TBook[];
  pagination: PaginationResult;
}

export class BookService {
  async getBooks(filters: BookFilters): Promise<BooksWithPagination> {
    try {
      const query: Record<string, unknown> = {};

      if (filters.title) {
        query.title = { $regex: filters.title, $options: 'i' };
      }

      if (filters.author) {
        query.author = { $regex: filters.author, $options: 'i' };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.minPages !== undefined || filters.maxPages !== undefined) {
        query.pageCount = {};
        if (filters.minPages !== undefined) {
          (query.pageCount as Record<string, number>).$gte = filters.minPages;
        }
        if (filters.maxPages !== undefined) {
          (query.pageCount as Record<string, number>).$lte = filters.maxPages;
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const [books, totalItems] = await Promise.all([
        BookModel.find(query).skip(skip).limit(limit).lean(),
        BookModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        books: books as TBook[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error('Error in getBooks:', error);
      throw new Error('Failed to fetch books');
    }
  }

  async getBookById(bookId: string): Promise<TBook> {
    try {
      const book = await BookModel.findById(bookId).lean();

      if (!book) {
        throw new NotFoundError('Book not found');
      }

      return book as TBook;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in getBookById:', error);
      throw new Error('Failed to fetch book');
    }
  }

  async createBook(data: CreateBookInput): Promise<TBook[]> {
    try {
      const quantity = data.quantity || 1;
      const books: TBook[] = [];

      for (let i = 0; i < quantity; i++) {
        const book = new BookModel({
          title: data.title,
          author: data.author,
          isbn: `${data.isbn}${quantity > 1 ? `-${i + 1}` : ''}`,
          category: data.category,
          pageCount: data.pageCount,
          publishedYear: data.publishedYear,
          status: data.status || 'importing',
        });

        const savedBook = await book.save();
        books.push(savedBook.toObject() as TBook);
      }

      return books;
    } catch (error) {
      logger.error('Error in createBook:', error);
      throw new Error('Failed to create book');
    }
  }

  async updateBookStatus(
    bookId: string,
    status: BookStatus,
    userRole: UserRole
  ): Promise<TBook> {
    try {
      const book = await BookModel.findById(bookId);

      if (!book) {
        throw new NotFoundError('Book not found');
      }

      // Librarian can only update to: available, borrowed, damaged
      if (userRole === 'librarian') {
        const allowedStatuses: BookStatus[] = ['available', 'borrowed', 'damaged'];
        if (!allowedStatuses.includes(status)) {
          throw new ForbiddenError(
            'Librarian can only update status to available, borrowed, or damaged'
          );
        }
      }

      // Admin can update to any status

      book.status = status;
      await book.save();

      return book.toObject() as TBook;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      logger.error('Error in updateBookStatus:', error);
      throw new Error('Failed to update book status');
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    try {
      const book = await BookModel.findByIdAndDelete(bookId);

      if (!book) {
        throw new NotFoundError('Book not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error in deleteBook:', error);
      throw new Error('Failed to delete book');
    }
  }
}

