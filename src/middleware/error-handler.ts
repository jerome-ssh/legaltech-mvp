import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AppError, ErrorCodes } from '@/lib/errors';

export function errorHandler(error: unknown, req: NextRequest) {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: ErrorCodes.DATABASE.CONNECTION_ERROR
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: ErrorCodes.DATABASE.CONNECTION_ERROR
    },
    { status: 500 }
  );
} 