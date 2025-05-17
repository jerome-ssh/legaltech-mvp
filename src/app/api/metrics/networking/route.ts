import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const { data: connections, error } = await supabaseAdmin
      .from('connections')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    const score = connections?.length ? Math.min(100, connections.length * 10) : 0;

    return NextResponse.json(
      { success: true, score },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in networking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 