interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export const responseWrapper = {
  success: <T>(data: T, message?: string): SuccessResponse<T> => ({
    success: true,
    message,
    data,
  }),

  error: (message: string, code: string, details?: unknown): ErrorResponse => ({
    success: false,
    message,
    error: {
      code,
      details,
    },
  }),
};

