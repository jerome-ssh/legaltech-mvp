import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid matter statuses
const VALID_STATUSES = ['active', 'pending', 'closed', 'archived'];

// GET /api/matters/[id]/status - Get matter status history
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

    // Verify matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Fetch status history
    const { data: statusHistory, error } = await supabase
      .from('matter_status')
      .select(`
        *,
        changed_by:users (
          email,
          full_name
        )
      `)
      .eq('matter_id', params.id)
      .order('changed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ statusHistory });
  } catch (error) {
    console.error('Error fetching matter status history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/matters/[id]/status - Update matter status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
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

    // Verify matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('cases')
      .select('id, status')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Create new status entry
    const { data: statusEntry, error: statusError } = await supabase
      .from('matter_status')
      .insert([
        {
          matter_id: params.id,
          status,
          previous_status: matter.status,
          changed_by: userId,
          notes: notes || 'Status updated',
          changed_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    // Update matter status
    const { error: updateError } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ status: statusEntry });
  } catch (error) {
    console.error('Error updating matter status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 