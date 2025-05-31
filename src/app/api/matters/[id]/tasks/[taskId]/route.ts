import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// PATCH /api/matters/[id]/tasks/[taskId] - Update a task
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
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
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    const { status, stage } = await request.json();

    if (!status && !stage) {
      return NextResponse.json(
        { error: 'Status or stage is required' },
        { status: 400 }
      );
    }

    // Get the current task to verify the update
    const { data: currentTask, error: fetchError } = await supabase
      .from('matter_tasks')
      .select('*')
      .eq('id', params.taskId)
      .single();

    if (fetchError || !currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('matter_tasks')
      .update({
        status: status || currentTask.status,
        stage: stage || currentTask.stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.taskId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/matters/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
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
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Delete the task
    const { error: deleteError } = await supabase
      .from('matter_tasks')
      .delete()
      .eq('id', params.taskId)
      .eq('matter_id', params.id);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    // Update matter progress
    await updateMatterProgress(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update matter progress
async function updateMatterProgress(matterId: string) {
  try {
    // Get all tasks for the matter
    const { data: tasks, error: tasksError } = await supabase
      .from('matter_tasks')
      .select('*')
      .eq('matter_id', matterId);

    if (tasksError) throw tasksError;

    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
    const completedWeight = tasks
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + (t.weight || 1), 0);

    // Calculate progress by stage
    const stages = ['Intake', 'Planning', 'Active Work', 'Closure'];
    const byStage = stages.reduce((acc, stage) => {
      const stageTasks = tasks.filter(t => t.stage === stage);
      const stageTotal = stageTasks.reduce((sum, t) => sum + (t.weight || 1), 0);
      const stageCompleted = stageTasks
        .filter(t => t.status === 'Completed')
        .reduce((sum, t) => sum + (t.weight || 1), 0);
      
      acc[stage] = stageTotal > 0 ? (stageCompleted / stageTotal) * 100 : 0;
      return acc;
    }, {} as Record<string, number>);

    // Calculate overall progress
    const overall = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    // Update matter progress
    const { error: updateError } = await supabase
      .from('matters')
      .update({
        progress: {
          overall,
          by_stage: byStage,
          completed_tasks: completedTasks,
          total_tasks: totalTasks,
          completed_weight: completedWeight,
          total_weight: totalWeight
        }
      })
      .eq('id', matterId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating matter progress:', error);
    throw error;
  }
} 