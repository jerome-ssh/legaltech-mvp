import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid sort fields and directions
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'status', 'priority'];
const VALID_SORT_DIRECTIONS = ['asc', 'desc'];

// Valid payment patterns
const VALID_PAYMENT_PATTERNS = ['Standard', 'Block', 'Subscription', 'Contingency', 'Hybrid'];

// Valid status values
const VALID_STATUS_VALUES = ['active', 'pending', 'closed', 'archived'];

// Valid priority values
const VALID_PRIORITY_VALUES = ['high', 'medium', 'low'];

// GET /api/matters/search - Search and filter matters
export async function GET(request: Request) {
  try {
    console.log('Starting matter search request...');
    
    const { userId } = auth();
    if (!userId) {
      console.error('Unauthorized: No userId provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching profile for userId:', userId);
    
    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('Profile found:', profile);

    // Get query parameters
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    console.log('Query parameters:', {
      searchQuery,
      status,
      priority,
      sortBy,
      sortDirection,
      page,
      pageSize
    });

    // Validate sort parameters
    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      console.error('Invalid sort field:', sortBy);
      return NextResponse.json(
        { error: `Invalid sort field. Must be one of: ${VALID_SORT_FIELDS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_SORT_DIRECTIONS.includes(sortDirection)) {
      console.error('Invalid sort direction:', sortDirection);
      return NextResponse.json(
        { error: `Invalid sort direction. Must be one of: ${VALID_SORT_DIRECTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && status !== 'all' && !VALID_STATUS_VALUES.includes(status)) {
      console.error('Invalid status value:', status);
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && priority !== 'all' && !VALID_PRIORITY_VALUES.includes(priority)) {
      console.error('Invalid priority value:', priority);
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITY_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('Building query...');

    // Build the query
    let query = supabase
      .from('matters')
      .select(`
        *,
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
          payment_pattern:payment_patterns (
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
          features,
          priority:priorities (
            id,
            name
          )
        ),
        matter_intake_links (
          token,
          status,
          used_at,
          completed_at,
          expires_at
        )
      `, { count: 'exact' })
      .eq('profile_id', profile.id);

    // Apply search filter
    if (searchQuery) {
      console.log('Applying search filter:', searchQuery);
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      console.log('Applying status filter:', status);
      query = query.eq('status', status);
    }

    // Apply sorting
    console.log('Applying sorting:', { sortBy, sortDirection });
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    console.log('Applying pagination:', { from, to });
    query = query.range(from, to);

    // Execute the query
    console.log('Executing query...');
    const { data: matters, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return empty array if no matters found
    if (!matters) {
      return NextResponse.json({
        matters: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0
        }
      });
    }

    // Validate the response data
    console.log('Validating response data...');
    matters.forEach((matter, index) => {
      // Log any missing or invalid fields
      if (!matter.matter_status) {
        console.warn(`Matter ${index} missing matter_status`);
      }
      if (!matter.matter_billing) {
        console.warn(`Matter ${index} missing matter_billing`);
      }
      if (matter.matter_billing) {
        // Only validate rate_value if rate_value is set
        if (matter.matter_billing.rate_value && !matter.matter_billing.currency) {
          console.warn(`Matter ${index} missing currency for rate_value ${matter.matter_billing.rate_value}`);
        }
      }
    });

    console.log('Query successful. Found', count, 'matters');
    
    return NextResponse.json({
      matters,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Unexpected error in matter search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 