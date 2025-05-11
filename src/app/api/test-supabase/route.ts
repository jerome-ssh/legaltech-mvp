import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Supabase configuration missing',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
          }
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try to select from an existing table
    const { data: healthCheck, error: healthError } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1)
      .single();

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Successfully connected to Supabase',
        timestamp: new Date().toISOString(),
        connectionTest: {
          canQuery: !healthError,
          error: healthError?.message,
          result: healthCheck
        },
        config: {
          hasUrl: !!supabaseUrl,
          urlLength: supabaseUrl?.length
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 