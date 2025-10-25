import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../util/errors';
import { config } from '../config/env';

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should attach user to request when token is valid', () => {
    const mockToken = 'valid-token';
    const mockDecoded = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'normal_user',
    };

    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`,
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toEqual({
      userId: 'user123',
      email: 'test@example.com',
      role: 'normal_user',
    });
    expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.jwtSecret);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next with UnauthorizedError when no token provided', () => {
    mockRequest.headers = {};

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No token provided',
      })
    );
  });

  it('should call next with UnauthorizedError when token is invalid', () => {
    const mockToken = 'invalid-token';
    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`,
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid token',
      })
    );
  });

  it('should handle authorization header without Bearer prefix', () => {
    mockRequest.headers = {
      authorization: 'some-token',
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

