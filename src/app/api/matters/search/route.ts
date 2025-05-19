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

// GET /api/matters/search - Search and filter matters
export async function GET(request: Request) {
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

    // Get query parameters
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    // Validate sort parameters
    if (!VALID_SORT_FIELDS.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sort field. Must be one of: ${VALID_SORT_FIELDS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_SORT_DIRECTIONS.includes(sortDirection)) {
      return NextResponse.json(
        { error: `Invalid sort direction. Must be one of: ${VALID_SORT_DIRECTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Build the query
    let query = supabase
      .from('cases')
      .select(`
        *,
        matter_status (
          status,
          changed_at
        ),
        matter_billing (
          billing_type,
          rate,
          currency
        )
      `, { count: 'exact' })
      .eq('profile_id', profile.id);

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply priority filter
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute the query
    const { data: matters, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      matters,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error searching matters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 