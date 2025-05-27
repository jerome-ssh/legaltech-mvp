import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Updated matter schema to match new structure
const matterSchema = z.object({
  title: z.string().min(1),
  client_id: z.string().uuid(),
  type_id: z.number(),
  sub_type_id: z.number(),
  description: z.string().optional(),
  jurisdiction: z.string().optional(),
  estimated_value: z.number().optional(),
  matter_date: z.string().optional(),
  intake_data: z.any().optional(), // Allow extra intake-specific data
  priority: z.enum(['High', 'Medium', 'Low']).optional(), // Used only for lookup, not stored
  // Billing fields
  billing_method_id: z.string().uuid(),
  payment_pattern_id: z.string().nullable().optional(),
  rate: z.number().optional(),
  currency: z.string().optional(),
  payment_terms: z.string().optional(),
  payment_medium_id: z.string().uuid().optional(),
  retainer_amount: z.number().optional(),
  retainer_balance: z.number().optional(),
  billing_frequency_id: z.string().nullable().optional(),
  notes: z.string().optional(),
  features: z.any().optional()
});

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
      .from('matters')
      .select(`
        *,
        matter_status (
          status,
          changed_at,
          notes
        ),
        matter_billing (
          payment_pattern:payment_patterns (
            value,
            label
          ),
          billing_method:billing_methods (
            id,
            value,
            label
          ),
          rate_value,
          currency:currencies (
            id,
            value,
            label
          ),
          terms_details,
          retainer_amount,
          retainer_balance,
          notes,
          features
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
      console.error('Auth error: No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const expectedFields = [
      'title',
      'client_id',
      'type_id',
      'sub_type_id',
      'description',
      'jurisdiction',
      'estimated_value',
      'matter_date',
      'intake_data',
      'priority',
      'billing_method_id',
      'payment_pattern_id',
      'rate',
      'currency',
      'payment_terms',
      'billing_frequency_id',
      'notes',
      'features'
    ];
    const receivedFields = Object.keys(body);
    const missingFields = expectedFields.filter(f => !(f in body));
    const processedFields: string[] = [];
    // Log all expected, received, missing fields
    console.log('--- MATTER CREATION DEBUG ---');
    console.log('Expected fields:', expectedFields);
    console.log('Received fields:', receivedFields);
    console.log('Missing fields:', missingFields);
    // Validate and parse
    const parseResult = matterSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Matter validation error:', parseResult.error.errors);
      return NextResponse.json({ error: 'Invalid matter data', details: parseResult.error.errors }, { status: 400 });
    }
    const matterData = parseResult.data;
    // Log which fields were actually processed (present in parsed data)
    for (const f of expectedFields) {
      if (matterData[f as keyof typeof matterData] !== undefined) {
        processedFields.push(f);
      }
    }
    console.log('Processed fields (after validation):', processedFields);
    console.log('Processed values:', processedFields.reduce((acc, f) => { acc[f] = matterData[f as keyof typeof matterData]; return acc; }, {} as any));

    // Set backend defaults for billing fields if not provided
    const billingDefaults = {
      payment_pattern_id: null,
      rate_value: 0,
      currency_id: null,
      terms_details: { standard: 'Net 30' },
      retainer_amount: 0,
      retainer_balance: 0,
      billing_frequency_id: null,
      notes: null,
      features: null,
    };
    // Build billingData to match the matter_billing schema
    const billingData = {
      matter_id: undefined,
      billing_method_id: matterData.billing_method_id,
      payment_pattern_id: matterData.payment_pattern_id ?? null,
      rate_value: matterData.rate ?? 0,
      currency_id: matterData.currency ?? null,
      payment_medium_id: matterData.payment_medium_id ?? null,
      retainer_amount: matterData.retainer_amount ?? 0,
      retainer_balance: matterData.retainer_balance ?? 0,
      billing_frequency_id: matterData.billing_frequency_id ?? null,
      notes: matterData.notes ?? null,
      features: matterData.features ?? null,
      priority_id: null,
      ...('terms_details' in matterData ? { terms_details: (matterData as any).terms_details } : { terms_details: { standard: 'Net 30' } }),
    };

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Look up the priority UUID
    let priorityId = null;
    if (matterData.priority) {
      const { data: priorityRow, error: priorityError } = await supabase
        .from('priorities')
        .select('id')
        .eq('name', matterData.priority)
        .single();
      if (priorityError || !priorityRow) {
        console.error('Priority lookup error:', priorityError || 'Not found');
        return NextResponse.json({ error: `Priority '${matterData.priority}' not found` }, { status: 400 });
      }
      priorityId = priorityRow.id;
    }
    // Insert into matters with priority_id
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .insert([
        {
          profile_id: profile.id,
          client_id: matterData.client_id,
          title: matterData.title,
          description: matterData.description,
          jurisdiction: matterData.jurisdiction,
          estimated_value: matterData.estimated_value,
          matter_date: matterData.matter_date,
          type_id: matterData.type_id,
          sub_type_id: matterData.sub_type_id,
          priority_id: priorityId,
          assigned_to: profile.id
        }
      ])
      .select()
      .single();
    if (matterError) {
      console.error('Supabase insert error:', matterError);
      return NextResponse.json({ error: matterError.message }, { status: 500 });
    }

    // Create initial matter status
    const { error: statusError } = await supabase
      .from('matter_status')
      .insert([
        {
          matter_id: matter.id,
          name: 'Active',
          status: 'active',
          changed_at: new Date().toISOString(),
          notes: 'Initial status'
        }
      ]);

    if (statusError) {
      console.error('Error creating matter status:', statusError);
      // Continue anyway as this is not critical
    }

    // Create initial matter progress
    const { error: progressError } = await supabase
      .from('matter_progress')
      .insert([
        {
          matter_id: matter.id,
          profile_id: profile.id,
          status: 'Not Started',
          notes: 'Initial progress entry',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (progressError) {
      console.error('Error creating matter progress:', progressError);
      // Continue anyway as this is not critical
    }

    // Insert into matter_billing with priority_id
    billingData.matter_id = matter.id;
    (billingData as any).priority_id = priorityId;
    if (Object.prototype.hasOwnProperty.call(billingData, 'priority')) delete (billingData as any).priority;
    const { error: billingError } = await supabase
      .from('matter_billing')
      .insert([
        billingData
      ]);
    if (billingError) {
      console.error('Error creating matter billing:', billingError);
      // Continue anyway as this is not critical
    }

    // On success, return a standard response
    return NextResponse.json(
      { success: true, matter, id: matter.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 