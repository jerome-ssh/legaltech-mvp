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
      .from('matters')
      .select(`
        *,
        type:matter_types!fk_matters_type (
          id,
          label
        ),
        sub_type:matter_sub_types!fk_matters_sub_type (
          id,
          label
        ),
        client:clients (
          id,
          first_name,
          last_name,
          avatar_url,
          email,
          phone_number,
          address,
          tags,
          date_of_birth,
          title:titles!clients_title_id_fkey (id, label),
          client_type:client_types!clients_client_type_id_fkey (id, label),
          preferred_language:languages!clients_preferred_language_id_fkey (id, label)
        ),
        priority:priorities (
          id,
          name
        ),
        matter_status (
          status,
          changed_at,
          notes
        ),
        matter_billing (
          id,
          rate_value,
          terms_details,
          retainer_amount,
          retainer_balance,
          features,
          notes,
          billing_method:billing_methods (
            id,
            value,
            label
          ),
          currency:currencies (
            id,
            value,
            label
          ),
          payment_pattern:payment_patterns (
            value,
            label,
            description,
            icon
          ),
          billing_frequency_id,
          payment_medium:payment_mediums (
            id,
            value,
            label,
            icon
          )
        ),
        matter_intake_links (
          token,
          status,
          created_at,
          used_at,
          completed_at,
          expires_at,
          form_data
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

    // Flatten type and sub_type for frontend compatibility (like search API)
    const matter_type = matter.type && typeof matter.type === 'object' ? matter.type.label : '';
    const matter_sub_type = matter.sub_type && typeof matter.sub_type === 'object' ? matter.sub_type.label : '';
    const responseMatter = {
      ...matter,
      matter_type,
      matter_sub_type,
    };

    return NextResponse.json({ matter: responseMatter });
  } catch (error) {
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
      .from('matters')
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
            name: status,
            status,
            changed_by: userId,
            notes: 'Status updated',
            changed_at: new Date().toISOString()
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
      .from('matters')
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