import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/matter-templates/apply/[matterId] - Apply or re-apply a template to a matter
export async function POST(
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

    // Get the template ID from the request body
    const { templateId, reset } = await request.json();
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Verify the matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id, type_id, sub_type_id, applied_template_id, profile_id')
      .eq('id', params.matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }
    if (matter.profile_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the template and its tasks
    const { data: template, error: templateError } = await supabase
      .from('matter_task_templates')
      .select(`
        *,
        tasks:matter_task_template_items (
          id,
          label,
          stage,
          default_weight,
          position
        )
      `)
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify template matches matter type/sub-type
    if (
      Number(template.matter_type_id) !== Number(matter.type_id) ||
      Number(template.sub_type_id) !== Number(matter.sub_type_id)
    ) {
      console.error('[APPLY API] Template type/sub-type mismatch:', {
        template_matter_type_id: template.matter_type_id,
        matter_type_id: matter.type_id,
        template_sub_type_id: template.sub_type_id,
        matter_sub_type_id: matter.sub_type_id
      });
      return NextResponse.json(
        { error: 'Template does not match matter type/sub-type' },
        { status: 400 }
      );
    }

    // If a different template is being applied, or reset is requested, delete all existing tasks for this matter
    if (matter.applied_template_id && (matter.applied_template_id !== templateId || reset)) {
      const { error: deleteError } = await supabase
        .from('matter_tasks')
        .delete()
        .eq('matter_id', params.matterId);
      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete existing tasks' }, { status: 500 });
      }
    } else if (matter.applied_template_id === templateId) {
      return NextResponse.json({
        success: true,
        message: 'Template already applied to this matter.'
      });
    } else {
      // Check if any tasks from this template already exist for this matter
      const { data: existingTasks, error: existingTasksError } = await supabase
        .from('matter_tasks')
        .select('id')
        .eq('matter_id', params.matterId)
        .limit(1);
      if (existingTasksError) {
        return NextResponse.json({ error: 'Error checking existing tasks' }, { status: 500 });
      }
      if (existingTasks && existingTasks.length > 0 && matter.applied_template_id) {
        return NextResponse.json({
          success: true,
          message: 'Tasks already exist for this matter. Template application skipped.'
        });
      }
    }

    // Create tasks from template
    const tasks = template.tasks.map((task: any) => ({
      matter_id: params.matterId,
      label: task.label,
      stage: task.stage,
      weight: task.default_weight,
      position: task.position,
      status: 'Not Started'
    }));

    // Insert tasks
    const { error: insertError } = await supabase
      .from('matter_tasks')
      .insert(tasks);

    if (insertError) {
      console.error('[APPLY API] Error creating tasks:', insertError, { tasks });
      return NextResponse.json(
        { error: 'Failed to create tasks', details: insertError.message },
        { status: 500 }
      );
    }

    // Update the matter to track the applied template
    const { error: updateMatterError } = await supabase
      .from('matters')
      .update({ applied_template_id: templateId })
      .eq('id', params.matterId);
    if (updateMatterError) {
      console.error('[APPLY API] Failed to update matter with applied template:', updateMatterError);
      return NextResponse.json({ error: 'Failed to update matter with applied template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully applied template "${template.template_name}" to matter`
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 