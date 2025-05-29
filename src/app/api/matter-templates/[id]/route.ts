import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matter-templates/[id] - Get a specific template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Fetch the template with its tasks
    const { data: template, error } = await supabase
      .from('matter_task_templates')
      .select(`
        *,
        matter_type:matter_types!matter_task_templates_matter_type_id_fkey (
          id,
          label
        ),
        sub_type:matter_sub_types!matter_task_templates_sub_type_id_fkey (
          id,
          label
        ),
        tasks:matter_task_template_items (
          id,
          label,
          stage,
          default_weight,
          position
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in template route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 