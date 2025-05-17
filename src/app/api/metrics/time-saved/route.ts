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

    const { data: activities, error } = await supabaseAdmin
      .from('user_activities')
      .select('time_saved')
      .eq('profile_id', profileId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching time saved:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch time saved' },
        { status: 500 }
      );
    }

    const timeSaved = activities?.reduce((acc, curr) => acc + (curr.time_saved || 0), 0) || 0;

    return NextResponse.json(
      { success: true, timeSaved },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in time saved API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 