import { createAuthenticatedClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const { getToken } = auth();
    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token available' },
        { status: 401 }
      );
    }

    const supabase = await createAuthenticatedClient(getToken);
    const { data, error } = await supabase.from('clients').select('count');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection and authentication working correctly',
      data
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 