import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matters - List all matters for the authenticated user
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

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch matters with related data
    const { data: matters, error } = await supabase
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
          currency
        )
      `)
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matters });
  } catch (error) {
    console.error('Error fetching matters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/matters - Create a new matter
export async function POST(request: Request) {
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

    // Create the matter
    const { data: matter, error } = await supabase
      .from('cases')
      .insert([
        {
          title,
          description,
          client_name,
          priority,
          status,
          profile_id: profile.id,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create initial matter status
    const { error: statusError } = await supabase
      .from('matter_status')
      .insert([
        {
          matter_id: matter.id,
          status: status || 'draft',
          changed_by: userId,
          notes: 'Initial status'
        }
      ]);

    if (statusError) {
      console.error('Error creating initial matter status:', statusError);
    }

    return NextResponse.json({ matter });
  } catch (error) {
    console.error('Error creating matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 