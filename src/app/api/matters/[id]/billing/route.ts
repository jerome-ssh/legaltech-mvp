import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid billing methods (from the billing_method table)
const VALID_BILLING_METHODS = [
  'Pro Bono',
  'Retainer',
  'Contingency',
  'Hourly',
  'Other',
  'Flat Fee'
] as const;
type BillingMethod = typeof VALID_BILLING_METHODS[number];

// Valid payment patterns (how the billing is processed)
const VALID_PAYMENT_PATTERNS = [
  'Standard',
  'Block',
  'Subscription',
  'Contingency',
  'Hybrid'
] as const;
type PaymentPattern = typeof VALID_PAYMENT_PATTERNS[number];

// Valid billing frequencies
const VALID_BILLING_FREQUENCIES = ['monthly', 'quarterly', 'upon_completion', 'milestone', 'custom'] as const;
type BillingFrequency = typeof VALID_BILLING_FREQUENCIES[number];

// billing_method: Describes how the billing is processed (e.g., standard, block, subscription, contingency, hybrid)
// payment_pattern: Describes the nature of the billing arrangement (e.g., Hourly, Retainer, Contingency, Pro Bono, Other, Flat Fee)
// The combination allows for flexible billing setups, e.g., Hourly + Block, Retainer + Standard, etc.

const billingSchema = z.object({
  matter_id: z.string().uuid(),
  billing_method_id: z.string().uuid(),
  payment_pattern_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  payment_medium_id: z.string().uuid().optional(),
  rate_value: z.number(),
  terms_details: z.object({
    standard: z.string(),
    custom: z.string().optional()
  }),
  billing_frequency_id: z.string().uuid().optional(),
  features: z.object({
    automated_time_capture: z.boolean().optional(),
    blockchain_invoicing: z.boolean().optional(),
    send_invoice_on_approval: z.boolean().optional()
  }).optional(),
  retainer_amount: z.number().optional(),
  retainer_balance: z.number().optional(),
  notes: z.string().optional(),
  priority_id: z.string().uuid().optional(),
  status_id: z.string().uuid().optional()
});

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
      .from('matters')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Fetch billing information with all related data
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .select(`
        *,
        payment_medium:payment_mediums (
          id, value, label, icon
        ),
        priority:priorities (
          id, name
        ),
        status:matter_status (
          id, name, status
        ),
        currency:currencies (
          id,
          value,
          label
        )
      `)
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
    const parseResult = billingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Invalid billing data', 
        details: parseResult.error.errors 
      }, { status: 400 });
    }
    const billingData = parseResult.data;

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
      .from('matters')
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

    // Create billing setup with all fields
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .insert([
        {
          matter_id: params.id,
          billing_method_id: billingData.billing_method_id,
          payment_pattern_id: billingData.payment_pattern_id,
          currency_id: billingData.currency_id,
          payment_medium_id: billingData.payment_medium_id,
          rate_value: billingData.rate_value,
          terms_details: billingData.terms_details,
          billing_frequency_id: billingData.billing_frequency_id,
          features: billingData.features,
          retainer_amount: billingData.retainer_amount,
          retainer_balance: billingData.retainer_balance,
          notes: billingData.notes,
          priority_id: billingData.priority_id,
          status_id: billingData.status_id
        }
      ])
      .select(`
        *,
        payment_medium:payment_mediums (
          id, value, label, icon
        ),
        priority:priorities (
          id, name
        ),
        status:matter_status (
          id, name, status
        ),
        currency:currencies (
          id,
          value,
          label
        )
      `)
      .single();

    if (error) {
      console.error('Error creating billing:', error);
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
    const parseResult = billingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid billing data', details: parseResult.error.errors }, { status: 400 });
    }
    const billingData = parseResult.data;

    // Validate payment_medium if provided
    if (billingData.payment_medium_id) {
      const { data: paymentMediumRow, error: paymentMediumError } = await supabase
        .from('payment_mediums')
        .select('id')
        .eq('id', billingData.payment_medium_id)
        .single();
      if (paymentMediumError || !paymentMediumRow) {
        return NextResponse.json({ error: 'Invalid payment medium' }, { status: 400 });
      }
    }

    // Validate priority if provided (by name)
    let priorityIdPut = null;
    if (billingData.priority_id) {
      const { data: priorityRow, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', billingData.priority_id)
        .single();
      if (priorityError || !priorityRow) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
      priorityIdPut = priorityRow.id;
    }

    // Validate status if provided
    if (billingData.status_id) {
      const { data: statusRow, error: statusError } = await supabase
        .from('matter_status')
        .select('id')
        .eq('id', billingData.status_id)
        .single();
      if (statusError || !statusRow) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
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
      .from('matters')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Update billing setup with all fields
    const { data: billing, error } = await supabase
      .from('matter_billing')
      .update({
        payment_pattern_id: billingData.payment_pattern_id,
        billing_method_id: billingData.billing_method_id,
        rate_value: billingData.rate_value,
        terms_details: billingData.terms_details,
        billing_frequency_id: billingData.billing_frequency_id,
        features: billingData.features,
        retainer_amount: billingData.retainer_amount,
        retainer_balance: billingData.retainer_balance,
        notes: billingData.notes,
        payment_medium_id: billingData.payment_medium_id,
        priority_id: priorityIdPut,
        status_id: billingData.status_id,
        updated_at: new Date().toISOString()
      })
      .eq('matter_id', params.id)
      .select(`
        *,
        payment_medium:payment_mediums (
          id, value, label, icon
        ),
        priority:priorities (
          id, name
        ),
        status:matter_status (
          id, name, status
        ),
        currency:currencies (
          id,
          value,
          label
        )
      `)
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