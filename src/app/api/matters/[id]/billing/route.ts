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
  billing_method: z.enum(VALID_BILLING_METHODS),
  payment_pattern: z.enum(VALID_PAYMENT_PATTERNS),
  currency: z.string().uuid(),
  // Optional fields
  rate: z.number().optional(),
  payment_terms: z.string().optional(),
  retainer_amount: z.number().optional(),
  retainer_balance: z.number().optional(),
  billing_frequency: z.enum(VALID_BILLING_FREQUENCIES).optional(),
  custom_frequency: z.string().optional(),
  billing_notes: z.string().optional(),
  payment_medium: z.string().uuid().optional(),
  priority: z.string().uuid().optional(),
  status: z.string().uuid().optional(),
  custom_terms: z.string().optional(),
  features: z.object({
    automated_time_capture: z.boolean().optional(),
    blockchain_invoicing: z.boolean().optional(),
    send_invoice_on_approval: z.boolean().optional()
  }).optional()
}).refine((data) => {
  // If billing_frequency is 'custom', custom_frequency must be provided
  if (data.billing_frequency === 'custom' && !data.custom_frequency) {
    return false;
  }
  return true;
}, {
  message: "Custom frequency is required when billing frequency is 'custom'"
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
          id, code, name, symbol
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

    // Validate currency exists
    const { data: currencyRow, error: currencyError } = await supabase
      .from('currencies')
      .select('id')
      .eq('id', billingData.currency)
      .single();
    if (currencyError || !currencyRow) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    // Validate payment_medium if provided
    if (billingData.payment_medium) {
      const { data: paymentMediumRow, error: paymentMediumError } = await supabase
        .from('payment_mediums')
        .select('id')
        .eq('id', billingData.payment_medium)
        .single();
      if (paymentMediumError || !paymentMediumRow) {
        return NextResponse.json({ error: 'Invalid payment medium' }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (billingData.priority) {
      const { data: priorityRow, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', billingData.priority)
        .single();
      if (priorityError || !priorityRow) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
    }

    // Validate status exists or set to default 'active'
    let statusId = billingData.status;
    if (!statusId) {
      const { data: statusRow, error: statusError } = await supabase
        .from('matter_status')
        .select('id')
        .eq('name', 'active')
        .single();
      if (statusError || !statusRow) {
        return NextResponse.json({ error: 'Default status "active" not found' }, { status: 400 });
      }
      statusId = statusRow.id;
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
          payment_pattern: billingData.payment_pattern,
          billing_method: billingData.billing_method,
          rate: billingData.rate,
          currency: billingData.currency,
          payment_terms: billingData.payment_terms,
          retainer_amount: billingData.retainer_amount,
          retainer_balance: billingData.retainer_balance,
          billing_frequency: billingData.billing_frequency,
          custom_frequency: billingData.custom_frequency,
          billing_notes: billingData.billing_notes,
          payment_medium: billingData.payment_medium,
          priority: billingData.priority,
          status: statusId,
          custom_terms: billingData.custom_terms,
          features: billingData.features
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
          id, code, name, symbol
        )
      `)
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
    const parseResult = billingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid billing data', details: parseResult.error.errors }, { status: 400 });
    }
    const billingData = parseResult.data;

    // Validate payment_medium if provided
    if (billingData.payment_medium) {
      const { data: paymentMediumRow, error: paymentMediumError } = await supabase
        .from('payment_mediums')
        .select('id')
        .eq('id', billingData.payment_medium)
        .single();
      if (paymentMediumError || !paymentMediumRow) {
        return NextResponse.json({ error: 'Invalid payment medium' }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (billingData.priority) {
      const { data: priorityRow, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('id', billingData.priority)
        .single();
      if (priorityError || !priorityRow) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      }
    }

    // Validate status if provided
    if (billingData.status) {
      const { data: statusRow, error: statusError } = await supabase
        .from('matter_status')
        .select('id')
        .eq('id', billingData.status)
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
        payment_pattern: billingData.payment_pattern,
        billing_method: billingData.billing_method,
        rate: billingData.rate,
        currency: billingData.currency,
        payment_terms: billingData.payment_terms,
        retainer_amount: billingData.retainer_amount,
        retainer_balance: billingData.retainer_balance,
        billing_frequency: billingData.billing_frequency,
        custom_frequency: billingData.custom_frequency,
        billing_notes: billingData.billing_notes,
        payment_medium: billingData.payment_medium,
        priority: billingData.priority,
        status: billingData.status,
        custom_terms: billingData.custom_terms,
        features: billingData.features,
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
          id, code, name, symbol
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