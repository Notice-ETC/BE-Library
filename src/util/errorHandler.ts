import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { responseWrapper } from './responseWrapper';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  InternalServerError,
} from './errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof NotFoundError) {
    res.status(404).json(responseWrapper.error(err.message, 'NOT_FOUND'));
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json(responseWrapper.error(err.message, 'UNAUTHORIZED'));
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json(responseWrapper.error(err.message, 'FORBIDDEN'));
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json(
      responseWrapper.error(err.message, 'VALIDATION_ERROR', err.details)
    );
    return;
  }

  if (err instanceof InternalServerError) {
    res.status(500).json(responseWrapper.error(err.message, 'INTERNAL_ERROR'));
    return;
  }

  // Default 500 error
  res.status(500).json(
    responseWrapper.error('Internal server error', 'INTERNAL_ERROR')
  );
};

