import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __dropdownCache: { [key: string]: { data: any; ts: number } } | undefined;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CACHE_KEY = 'dropdown_billing_methods';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
if (!globalThis.__dropdownCache) globalThis.__dropdownCache = {};

export async function GET() {
  const now = Date.now();
  const cache = globalThis.__dropdownCache!;
  if (cache[CACHE_KEY] && now - cache[CACHE_KEY].ts < CACHE_TTL) {
    return NextResponse.json({ options: cache[CACHE_KEY].data });
  }
  const { data, error } = await supabase
    .from('billing_methods')
    .select('id, value, label')
    .order('label', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  cache[CACHE_KEY] = { data, ts: now };
  return NextResponse.json({ options: data });
} 