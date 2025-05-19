import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid billing types
const VALID_BILLING_TYPES = [
  'hourly',
  'fixed',
  'contingency',
  'hybrid',
  'block_fee',
  'subscription'
];

// Valid billing frequencies
const VALID_BILLING_FREQUENCIES = [
  'monthly',
  'quarterly',
  'upon_completion',
  'milestone',
  'custom'
];

// GET /api/matters/[id]/billing - Get matter billing information
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

    // Fetch billing information
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .select('*')
      .eq('matter_id', params.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ billing });
  } catch (error) {
    console.error('Error fetching matter billing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/matters/[id]/billing - Create matter billing setup
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      billing_type,
      rate,
      currency = 'USD',
      payment_terms,
      retainer_amount,
      retainer_balance,
      billing_frequency,
      custom_frequency,
      billing_notes
    } = body;

    // Validate billing type
    if (!billing_type || !VALID_BILLING_TYPES.includes(billing_type)) {
      return NextResponse.json(
        { error: `Invalid billing type. Must be one of: ${VALID_BILLING_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate billing frequency if provided
    if (billing_frequency && !VALID_BILLING_FREQUENCIES.includes(billing_frequency)) {
      return NextResponse.json(
        { error: `Invalid billing frequency. Must be one of: ${VALID_BILLING_FREQUENCIES.join(', ')}` },
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
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Check if billing already exists
    const { data: existingBilling } = await supabase
      .from('matter_billing')
      .select('id')
      .eq('matter_id', params.id)
      .single();

    if (existingBilling) {
      return NextResponse.json(
        { error: 'Billing setup already exists for this matter' },
        { status: 400 }
      );
    }

    // Create billing setup
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .insert([
        {
          matter_id: params.id,
          billing_type,
          rate,
          currency,
          payment_terms,
          retainer_amount,
          retainer_balance: retainer_balance || retainer_amount,
          billing_frequency,
          custom_frequency,
          billing_notes
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ billing });
  } catch (error) {
    console.error('Error creating matter billing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/matters/[id]/billing - Update matter billing setup
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
    const {
      billing_type,
      rate,
      currency,
      payment_terms,
      retainer_amount,
      retainer_balance,
      billing_frequency,
      custom_frequency,
      billing_notes
    } = body;

    // Validate billing type if provided
    if (billing_type && !VALID_BILLING_TYPES.includes(billing_type)) {
      return NextResponse.json(
        { error: `Invalid billing type. Must be one of: ${VALID_BILLING_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate billing frequency if provided
    if (billing_frequency && !VALID_BILLING_FREQUENCIES.includes(billing_frequency)) {
      return NextResponse.json(
        { error: `Invalid billing frequency. Must be one of: ${VALID_BILLING_FREQUENCIES.join(', ')}` },
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
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Update billing setup
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .update({
        billing_type,
        rate,
        currency,
        payment_terms,
        retainer_amount,
        retainer_balance,
        billing_frequency,
        custom_frequency,
        billing_notes,
        updated_at: new Date().toISOString()
      })
      .eq('matter_id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!billing) {
      return NextResponse.json(
        { error: 'Billing setup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ billing });
  } catch (error) {
    console.error('Error updating matter billing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 