import { AppError, handleError } from './errors';
import { NextResponse } from 'next/server';

export const createApiResponse = <T>(
  data: T,
  message?: string,
  status: number = 200
) => {
  return NextResponse.json({
    success: true,
    data,
    message,
  }, { status });
};

export const createApiError = (
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
) => {
  const errorResponse = handleError(error);
  return NextResponse.json(errorResponse, { status: errorResponse.status });
};

// Helper to wrap API route handlers with error handling
export const withErrorHandling = <T extends (...args: any[]) => Promise<Response>>(
  handler: T
) => {
  return async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createApiError(error);
    }
  };
};

// Helper to validate request body
export const validateRequestBody = <T>(
  body: unknown,
  schema: { parse: (data: unknown) => T }
): T => {
  try {
    return schema.parse(body);
  } catch (error) {
    throw new AppError(
      'Invalid request body',
      'VALIDATION_INVALID_INPUT',
      400
    );
  }
};

// Helper to check required fields
export const checkRequiredFields = (
  data: Record<string, any>,
  fields: string[]
) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      'VALIDATION_MISSING_REQUIRED',
      400
    );
  }
}; 