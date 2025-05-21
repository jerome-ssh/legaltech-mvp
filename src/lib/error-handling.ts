import { NextResponse } from 'next/server';

export const ErrorCodes = {
  AUTH: {
    UNAUTHORIZED: 'AUTH_001',
    TOKEN_INVALID: 'AUTH_002',
    TOKEN_EXPIRED: 'AUTH_003',
    INVALID_CREDENTIALS: 'AUTH_004'
  },
  DATABASE: {
    CONNECTION_ERROR: 'DB_001',
    QUERY_ERROR: 'DB_002',
    TRANSACTION_ERROR: 'DB_003',
    CONSTRAINT_ERROR: 'DB_004'
  },
  EXTERNAL_SERVICE: {
    API_ERROR: 'EXT_001',
    TIMEOUT: 'EXT_002',
    RATE_LIMIT: 'EXT_003'
  },
  VALIDATION: {
    INVALID_INPUT: 'VAL_001',
    MISSING_REQUIRED: 'VAL_002',
    INVALID_FORMAT: 'VAL_003'
  }
} as const;

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { success: true, ...data },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  );
}

export function createErrorResponse(message: string, status: number, code: string) {
  return Response.json(
    { error: message, code },
    { status }
  );
} 