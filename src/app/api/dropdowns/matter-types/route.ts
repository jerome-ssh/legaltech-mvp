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

const CACHE_KEY = 'dropdown_matter_types';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
if (!globalThis.__dropdownCache) globalThis.__dropdownCache = {};

export async function GET() {
  const now = Date.now();
  const cache = globalThis.__dropdownCache!;
  if (cache[CACHE_KEY] && now - cache[CACHE_KEY].ts < CACHE_TTL) {
    return NextResponse.json({ options: cache[CACHE_KEY].data });
  }
  // Fetch matter types
  const { data: types, error: typeError } = await supabase
    .from('matter_types')
    .select('id, value, label')
    .order('label', { ascending: true });

  if (typeError) {
    return NextResponse.json({ error: typeError.message }, { status: 500 });
  }
  // Fetch sub-types
  const { data: subTypes, error: subTypeError } = await supabase
    .from('matter_sub_types')
    .select('id, matter_type_id, value, label')
    .order('label', { ascending: true });

  if (subTypeError) {
    return NextResponse.json({ error: subTypeError.message }, { status: 500 });
  }
  // Attach subTypes to each type
  const options = types.map(type => ({
    ...type,
    subTypes: subTypes.filter(sub => sub.matter_type_id === type.id)
  }));
  cache[CACHE_KEY] = { data: options, ts: now };
  return NextResponse.json({ options });
} 