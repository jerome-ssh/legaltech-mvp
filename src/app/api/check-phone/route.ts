import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', phone)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows found
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    return NextResponse.json({ exists: !!data });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 