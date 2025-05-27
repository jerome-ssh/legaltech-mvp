import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Task, TaskStatus } from '@/types/matter';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matters/[id]/tasks - Get all tasks for a matter
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: tasks, error } = await supabase
      .from('matter_tasks')
      .select('*')
      .eq('matter_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/matters/[id]/tasks - Create a new task
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { label, stage, weight, status } = body;

    // Validate required fields
    if (!label || !stage || !weight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('matter_tasks')
      .insert({
        matter_id: params.id,
        label,
        stage,
        weight,
        status: status || 'Not Started'
      })
      .select()
      .single();

    if (error) throw error;

    // Update matter progress
    await updateMatterProgress(params.id);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PATCH /api/matters/[id]/tasks/[taskId] - Update a task
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('matter_tasks')
      .update({ status })
      .eq('id', params.taskId)
      .eq('matter_id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Update matter progress
    await updateMatterProgress(params.id);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
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
    const { error } = await supabase
      .from('matter_tasks')
      .delete()
      .eq('id', params.taskId)
      .eq('matter_id', params.id);

    if (error) throw error;

    // Update matter progress
    await updateMatterProgress(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
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
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
    const completedWeight = tasks
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + t.weight, 0);

    // Calculate progress by stage
    const stages = ['Intake', 'Planning', 'Active Work', 'Closure'];
    const byStage = stages.reduce((acc, stage) => {
      const stageTasks = tasks.filter(t => t.stage === stage);
      const stageTotal = stageTasks.reduce((sum, t) => sum + t.weight, 0);
      const stageCompleted = stageTasks
        .filter(t => t.status === 'Completed')
        .reduce((sum, t) => sum + t.weight, 0);
      
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