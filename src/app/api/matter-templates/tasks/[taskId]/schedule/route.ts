import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/matter-templates/tasks/[taskId]/schedule - Link a task with a calendar schedule
export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
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

    // Get schedule details from request body
    const { 
      title,
      start_time,
      end_time,
      description,
      type = 'task',
      status = 'scheduled',
      participants = [],
      location,
      is_recurring = false,
      recurrence_pattern,
      reminder_time,
      reminder_type = [],
      matter_id,
      matter_title,
      matter_link
    } = await request.json();

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Verify the task exists and user has access
    const { data: task, error: taskError } = await supabase
      .from('matter_tasks')
      .select(`
        id,
        matter:matters!inner (
          id,
          profile_id,
          title
        )
      `)
      .eq('id', params.taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!Array.isArray(task.matter) || !task.matter[0]) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }
    if (task.matter[0].profile_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Compose metadata
    const metadata = {
      matter_id: matter_id || task.matter[0].id,
      matter_title: matter_title || task.matter[0].title,
      matter_link: matter_link || `/matters/${task.matter[0].id}`
    };

    // Create schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        profile_id: profile.id,
        title,
        start_time,
        end_time,
        description,
        type,
        status,
        participants,
        location,
        is_recurring,
        recurrence_pattern,
        reminder_time,
        reminder_type,
        reminder_sent: false,
        metadata // Store matter metadata
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error creating schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      );
    }

    // Update task with schedule ID
    const { error: updateError } = await supabase
      .from('matter_tasks')
      .update({ schedule_id: schedule.id })
      .eq('id', params.taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to link task with schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      schedule,
      message: 'Task linked with schedule successfully'
    });
  } catch (error) {
    console.error('Error linking task with schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/matter-templates/tasks/[taskId]/schedule - Unlink a task from its schedule
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
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

    // Get the task and its schedule
    const { data: task, error: taskError } = await supabase
      .from('matter_tasks')
      .select(`
        id,
        schedule_id,
        matter:matters!inner (
          id,
          profile_id
        )
      `)
      .eq('id', params.taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!Array.isArray(task.matter) || !task.matter[0]) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }
    if (task.matter[0].profile_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!task.schedule_id) {
      return NextResponse.json(
        { error: 'Task is not linked to any schedule' },
        { status: 400 }
      );
    }

    // Delete the schedule
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', task.schedule_id);

    if (deleteError) {
      console.error('Error deleting schedule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    // Update task to remove schedule reference
    const { error: updateError } = await supabase
      .from('matter_tasks')
      .update({ schedule_id: null })
      .eq('id', params.taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlink task from schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task unlinked from schedule successfully'
    });
  } catch (error) {
    console.error('Error unlinking task from schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 