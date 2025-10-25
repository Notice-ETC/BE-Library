import { Request, Response, NextFunction } from 'express';
import { requireRole } from './role.middleware';
import { UnauthorizedError, ForbiddenError } from '../util/errors';
import { UserRole } from '../types/express';

describe('requireRole', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next when user has required role', () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'admin@example.com',
      role: 'admin' as UserRole,
    };

    const middleware = requireRole(['admin']);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next when user has one of multiple allowed roles', () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'librarian@example.com',
      role: 'librarian' as UserRole,
    };

    const middleware = requireRole(['librarian', 'admin']);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with UnauthorizedError when user is not authenticated', () => {
    mockRequest.user = undefined;

    const middleware = requireRole(['admin']);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not authenticated',
      })
    );
  });

  it('should call next with ForbiddenError when user lacks required role', () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'user@example.com',
      role: 'normal_user' as UserRole,
    };

    const middleware = requireRole(['admin']);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Insufficient permissions',
      })
    );
  });

  it('should allow normal_user when specified in allowed roles', () => {
    mockRequest.user = {
      userId: 'user123',
      email: 'user@example.com',
      role: 'normal_user' as UserRole,
    };

    const middleware = requireRole(['normal_user', 'librarian', 'admin']);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });
});

