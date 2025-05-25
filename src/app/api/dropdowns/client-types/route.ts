import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CACHE_KEY = 'dropdown_client_types';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

declare global {
  // eslint-disable-next-line no-var
  var __dropdownCache: { [key: string]: { data: any; ts: number } } | undefined;
}

if (!globalThis.__dropdownCache) globalThis.__dropdownCache = {};

export async function GET() {
  const now = Date.now();
  const cache = globalThis.__dropdownCache!;
  if (cache[CACHE_KEY] && now - cache[CACHE_KEY].ts < CACHE_TTL) {
    return NextResponse.json({ options: cache[CACHE_KEY].data });
  }
  try {
    const { data: options, error } = await supabase
      .from('client_types')
      .select('id, value, label')
      .order('id');

    if (error) {
      console.error('Error fetching client type options:', error);
      return NextResponse.json({ error: 'Failed to fetch client type options' }, { status: 500 });
    }

    cache[CACHE_KEY] = { data: options, ts: now };
    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error fetching client type options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 