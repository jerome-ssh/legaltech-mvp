import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matters/[id] - Get a specific matter
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

    // Fetch matter with related data
    const { data: matter, error } = await supabase
      .from('cases')
      .select(`
        *,
        matter_status (
          status,
          changed_at,
          notes
        ),
        matter_billing (
          billing_type,
          rate,
          currency,
          payment_terms,
          retainer_amount,
          retainer_balance
        ),
        matter_intake_links (
          token,
          status,
          sent_at,
          completed_at,
          expires_at
        )
      `)
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    return NextResponse.json({ matter });
  } catch (error) {
    console.error('Error fetching matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/matters/[id] - Update a matter
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
    const { title, description, client_name, priority, status } = body;

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update the matter
    const { data: matter, error } = await supabase
      .from('cases')
      .update({
        title,
        description,
        client_name,
        priority,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // If status was updated, create a new status entry
    if (status) {
      const { error: statusError } = await supabase
        .from('matter_status')
        .insert([
          {
            matter_id: params.id,
            status,
            changed_by: userId,
            notes: 'Status updated'
          }
        ]);

      if (statusError) {
        console.error('Error creating status update:', statusError);
      }
    }

    return NextResponse.json({ matter });
  } catch (error) {
    console.error('Error updating matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/matters/[id] - Delete a matter
export async function DELETE(
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

    // Delete the matter
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', params.id)
      .eq('profile_id', profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 