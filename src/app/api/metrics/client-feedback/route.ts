import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    console.log('Calculating client feedback score for profile:', profileId);

    // Query client feedback
    const { data: feedback, error } = await supabaseAdmin
      .from('client_feedback')
      .select('rating')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error querying client feedback:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!feedback?.length) {
      console.log('No client feedback found');
      return NextResponse.json({ score: 0 });
    }

    console.log(`Found ${feedback.length} feedback entries`);
    const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length;
    const score = Number(averageRating.toFixed(1));
    console.log('Average rating calculated:', score);

    return NextResponse.json({ score });
  } catch (error: any) {
    console.error('Error in client feedback calculation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 