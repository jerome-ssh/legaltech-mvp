import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
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

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Try to get up to 5 active/open matters with soonest deadlines
    let matters, error;
    try {
      const result = await supabase
        .from('matters')
        .select(`
          id,
          title,
          priority:priorities!matters_priority_id_fkey (name),
          deadline,
          created_at,
          updated_at,
          progress,
          client:clients (
            first_name,
            last_name,
            avatar_url
          ),
          matter_type:matter_types!fk_matters_type (label),
          sub_type:matter_sub_types!fk_matters_sub_type (label),
          matter_status (
            status,
            changed_at
          )
        `)
        .eq('profile_id', profile.id)
        .order('deadline', { ascending: true })
        .order('updated_at', { ascending: false })
        .limit(5);
      matters = result.data;
      error = result.error;
      if (error) {
        console.error('[DEBUG][matters-tracker] Main query error:', error);
        console.error('[DEBUG][matters-tracker] Query params:', { profileId: profile.id });
        return NextResponse.json({ error: error.message, details: error, stack: error.stack }, { status: 500 });
      }
    } catch (err: any) {
      console.error('[DEBUG][matters-tracker] Main query exception:', err);
      return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }

    // If not enough, fallback to most recently updated matters
    if (!matters || matters.length === 0) {
      try {
        const fallbackResult = await supabase
          .from('matters')
          .select(`
            id,
            title,
            priority:priorities!matters_priority_id_fkey (name),
            deadline,
            created_at,
            updated_at,
            progress,
            client:clients (
              first_name,
              last_name,
              avatar_url
            ),
            matter_type:matter_types!fk_matters_type (label),
            sub_type:matter_sub_types!fk_matters_sub_type (label),
            matter_status (
              status,
              changed_at
            )
          `)
          .eq('profile_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(5);
        matters = fallbackResult.data;
        error = fallbackResult.error;
        if (error) {
          console.error('[DEBUG][matters-tracker] Fallback query error:', error);
          console.error('[DEBUG][matters-tracker] Fallback query params:', { profileId: profile.id });
          return NextResponse.json({ error: error.message, details: error, stack: error.stack }, { status: 500 });
        }
      } catch (err: any) {
        console.error('[DEBUG][matters-tracker] Fallback query exception:', err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
      }
      matters = matters || [];
    }

    // Flatten and transform for frontend
    const transformed = (matters || []).map(matter => {
      // Handle possible array or object for joined fields
      const priorityObj = Array.isArray(matter.priority) ? matter.priority[0] : matter.priority;
      const clientObj = Array.isArray(matter.client) ? matter.client[0] : matter.client;
      const matterTypeObj = Array.isArray(matter.matter_type) ? matter.matter_type[0] : matter.matter_type;
      const subTypeObj = Array.isArray(matter.sub_type) ? matter.sub_type[0] : matter.sub_type;
      // Get latest status from matter_status array (ordered by changed_at desc)
      let status = 'Unspecified';
      if (Array.isArray(matter.matter_status) && matter.matter_status.length > 0) {
        status = matter.matter_status[0]?.status || 'Unspecified';
      }
      return {
        id: matter.id,
        title: matter.title,
        status,
        priority: priorityObj?.name || 'Unspecified',
        due_date: matter.deadline,
        created_at: matter.created_at,
        updated_at: matter.updated_at,
        progress: matter.progress || null,
        client_name: clientObj ? `${clientObj.first_name || ''} ${clientObj.last_name || ''}`.trim() : 'Unknown Client',
        client_avatar_url: clientObj?.avatar_url || '',
        matter_type: matterTypeObj?.label || '',
        matter_sub_type: subTypeObj?.label || '',
      };
    });

    return NextResponse.json({ matters: transformed });
  } catch (error: any) {
    console.error('[DEBUG][matters-tracker] General API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error', stack: error.stack }, { status: 500 });
  }
} 