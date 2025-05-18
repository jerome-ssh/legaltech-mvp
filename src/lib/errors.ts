export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status
    };
  }
  
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500
  };
};

// Common error codes
export const ErrorCodes = {
  AUTH: {
    TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
    TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  },
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
    MISSING_REQUIRED: 'VALIDATION_MISSING_REQUIRED',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    DUPLICATE_RECORD: 'VALIDATION_DUPLICATE_RECORD',
  },
  DATABASE: {
    CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DUPLICATE_RECORD: 'DB_DUPLICATE_RECORD',
    REFERENCE_ERROR: 'DB_REFERENCE_ERROR',
    NO_DATA: 'DB_NO_DATA',
  },
  CONFIG: {
    MISSING_ENV: 'CONFIG_MISSING_ENV',
    INVALID_ENV: 'CONFIG_INVALID_ENV',
  },
} as const; 