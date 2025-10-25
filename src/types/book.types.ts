import mongoose from 'mongoose';

export type BookStatus = 'available' | 'borrowed' | 'damaged' | 'importing' | 'lost';

export interface TBook {
  title: string;
  author: string;
  isbn: string;
  category: string;
  pageCount: number;
  publishedYear: number;
  status: BookStatus;
  borrowedBy?: string;
  borrowedAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TBookDocument extends TBook, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

export interface CreateBookInput {
  title: string;
  author: string;
  isbn: string;
  category: string;
  pageCount: number;
  publishedYear: number;
  status?: BookStatus;
  quantity?: number;
}

export interface UpdateBookStatusInput {
  status: BookStatus;
  reason?: string;
}

export interface BookFilters {
  title?: string;
  author?: string;
  status?: BookStatus;
  category?: string;
  minPages?: number;
  maxPages?: number;
  page?: number;
  limit?: number;
}

