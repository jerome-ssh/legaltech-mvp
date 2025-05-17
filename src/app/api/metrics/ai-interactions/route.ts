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

    const { data: interactions, error } = await supabaseAdmin
      .from('ai_interactions')
      .select('*')
      .eq('profile_id', profileId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching AI interactions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch AI interactions' },
        { status: 500 }
      );
    }

    const count = interactions?.length || 0;

    return NextResponse.json(
      { success: true, count },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in AI interactions API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 