import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a service role client
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

    // Get the most recent metrics
    const { data: metrics, error } = await supabaseAdmin
      .from('user_metrics')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // If no metrics exist, return success with null metrics
    if (!metrics || metrics.length === 0) {
      return NextResponse.json(
        { success: true, metrics: null },
        { status: 200 }
      );
    }

    // Return the first (most recent) metrics
    return NextResponse.json(
      { success: true, metrics: metrics[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in metrics fetch API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 