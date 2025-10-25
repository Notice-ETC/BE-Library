import mongoose, { Schema } from 'mongoose';
import { TBookDocument } from '@/types/book.types';

const BookSchema = new Schema<TBookDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pageCount: {
      type: Number,
      required: true,
      min: 1,
    },
    publishedYear: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'borrowed', 'damaged', 'importing', 'lost'],
      default: 'importing',
      required: true,
      index: true,
    },
    borrowedBy: {
      type: String,
      required: false,
    },
    borrowedAt: {
      type: Date,
      required: false,
    },
    dueDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
BookSchema.index({ status: 1, category: 1 });
BookSchema.index({ author: 1, title: 1 });

export const BookModel = mongoose.model<TBookDocument>('Book', BookSchema);

