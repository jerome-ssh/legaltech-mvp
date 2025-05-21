import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client using the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch a simple query to confirm live data
    const { data, error } = await supabase.from('profiles').select('id, email').limit(1);
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'success', data });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 