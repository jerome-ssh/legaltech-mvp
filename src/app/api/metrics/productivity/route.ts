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

    console.log('Calculating productivity score for profile:', profileId);

    // Query tasks from the last 7 days
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId)
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error querying tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!tasks?.length) {
      console.log('No tasks found for productivity calculation');
      return NextResponse.json({ score: 0 });
    }

    console.log(`Found ${tasks.length} tasks`);
    const completedTasks = tasks.filter(task => task.status === 'completed');
    console.log(`${completedTasks.length} tasks completed out of ${tasks.length}`);

    const score = Math.round((completedTasks.length / tasks.length) * 100);
    console.log('Productivity score calculated:', score);

    return NextResponse.json({ score });
  } catch (error: any) {
    console.error('Error in productivity calculation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 