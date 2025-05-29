import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/matter-templates/custom/[matterId] - Add custom tasks to a matter
export async function POST(
  request: Request,
  { params }: { params: { matterId: string } }
) {
  try {
    console.log('[CUSTOM TASK API] Incoming request for matterId:', params.matterId);
    const { userId } = auth();
    console.log('[CUSTOM TASK API] Auth userId:', userId);
    if (!userId) {
      console.log('[CUSTOM TASK API] Unauthorized: No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    console.log('[CUSTOM TASK API] Profile lookup:', { profile, profileError });

    if (profileError) {
      console.log('[CUSTOM TASK API] Profile not found');
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify the matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id')
      .eq('id', params.matterId)
      .eq('profile_id', profile.id)
      .single();
    console.log('[CUSTOM TASK API] Matter lookup:', { matter, matterError });

    if (matterError || !matter) {
      console.log('[CUSTOM TASK API] Matter not found');
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Get tasks from request body
    const { tasks } = await request.json();
    console.log('[CUSTOM TASK API] Tasks from request:', tasks);
    if (!Array.isArray(tasks) || tasks.length === 0) {
      console.log('[CUSTOM TASK API] Tasks array is required');
      return NextResponse.json(
        { error: 'Tasks array is required' },
        { status: 400 }
      );
    }

    // Validate each task
    const validatedTasks = tasks.map((task: any) => ({
      matter_id: params.matterId,
      label: task.label,
      stage: task.stage || 'Active Work',
      weight: task.weight || 1,
      position: task.position || 0,
      status: 'Not Started',
      description: task.description || null,
      due_date: task.due_date || null,
      schedule_id: task.schedule_id || null
    }));
    console.log('[CUSTOM TASK API] Validated tasks:', validatedTasks);

    // Insert tasks
    const { data: insertedTasks, error: insertError } = await supabase
      .from('matter_tasks')
      .insert(validatedTasks)
      .select();
    console.log('[CUSTOM TASK API] Inserted tasks:', { insertedTasks, insertError });

    if (insertError) {
      console.error('[CUSTOM TASK API] Error creating tasks:', insertError);
      return NextResponse.json(
        { error: 'Failed to create tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      tasks: insertedTasks
    });
  } catch (error) {
    console.error('[CUSTOM TASK API] Error adding custom tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/matter-templates/custom/[matterId] - Delete tasks from a matter
export async function DELETE(
  request: Request,
  { params }: { params: { matterId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify the matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id')
      .eq('id', params.matterId)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Get task IDs from request body
    const { taskIds } = await request.json();
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'Task IDs array is required' },
        { status: 400 }
      );
    }

    // Delete tasks
    const { error: deleteError } = await supabase
      .from('matter_tasks')
      .delete()
      .eq('matter_id', params.matterId)
      .in('id', taskIds);

    if (deleteError) {
      console.error('Error deleting tasks:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tasks deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 