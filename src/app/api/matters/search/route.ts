import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid sort fields and directions
const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'matter_status.status', 'priority', 'client_name'];
const VALID_SORT_DIRECTIONS = ['asc', 'desc'];

// Valid payment patterns
const VALID_PAYMENT_PATTERNS = ['Standard', 'Block', 'Subscription', 'Contingency', 'Hybrid'];

// Valid status values
const VALID_STATUS_VALUES = ['active', 'pending', 'closed', 'archived', 'completed'];

// Valid priority values
const VALID_PRIORITY_VALUES = ['high', 'medium', 'low'];

// Type definitions
interface MatterResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status: string;
  priority: string | null;
  client_name: string;
  client_avatar_url: string;
  matter_type: string;
  sub_type: string;
  tags: string[];
  progress: number;
  billing_method: string;
  rate: number | undefined;
  currency: string;
}

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
    const status = url.searchParams.get('status')?.toLowerCase() || 'all';
    const statuses = status !== 'all' ? status.split(',') : [];
    const priority = url.searchParams.get('priority')?.toLowerCase() || 'all';
    const priorities = priority !== 'all' ? priority.split(',') : [];
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortDirection = url.searchParams.get('sortDirection') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be positive and pageSize must be between 1 and 100.' },
        { status: 400 }
      );
    }

    console.log('Query parameters:', {
      searchQuery,
      status,
      statuses,
      priority,
      priorities,
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

    // Validate statuses if provided
    if (statuses.length > 0) {
      const invalidStatuses = statuses.filter(s => !VALID_STATUS_VALUES.includes(s));
      if (invalidStatuses.length > 0) {
        console.error('Invalid status values:', invalidStatuses);
        return NextResponse.json(
          { error: `Invalid statuses. Must be one or more of: ${VALID_STATUS_VALUES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate priorities if provided
    if (priorities.length > 0) {
      const invalidPriorities = priorities.filter(p => !VALID_PRIORITY_VALUES.includes(p));
      if (invalidPriorities.length > 0) {
        console.error('Invalid priority values:', invalidPriorities);
        return NextResponse.json(
          { error: `Invalid priorities. Must be one or more of: ${VALID_PRIORITY_VALUES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    console.log('Building query...');

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    console.log('Applying pagination:', { from, to });

    // Execute the query
    console.log('Executing query...');
    let query = supabase
      .from('matters')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        priority_id,
        profile_id,
        jurisdiction,
        deadline,
        tags,
        matter_progress (
          id,
          status,
          notes,
          completed_at
        ),
        estimated_value,
        type_id,
        sub_type_id,
        matter_type:matter_types!fk_matters_type (
          id,
          label
        ),
        sub_type:matter_sub_types!fk_matters_sub_type (
          id,
          label
        ),
        client:clients (
          first_name,
          last_name,
          avatar_url
        ),
        matter_status!inner (
          status
        ),
        priority:priorities!matters_priority_id_fkey (
          id,
          name
        ),
        matter_billing (
          rate_value,
          currency:currencies (
            id,
            label,
            value
          ),
          billing_method:billing_methods (
            id,
            value,
            label
          )
        ),
        matter_notes:matter_notes (
          id,
          author_id,
          content,
          created_at
        ),
        matter_tags:matter_tags (
          tag
        )
      `, { count: 'exact' })
      .eq('profile_id', profile.id);

    // Add priority filter if specified
    if (priorities.length > 0) {
      query = query.in('priority.name', priorities);
    }

    // Add status filter if specified
    if (statuses.length > 0) {
      query = query.in('matter_status!inner.status', statuses);
    }

    // Add search query if specified
    if (searchQuery) {
      query = query.or(`
        title.ilike.%${searchQuery}%,
        client(first_name).ilike.%${searchQuery}%,
        client(last_name).ilike.%${searchQuery}%,
        matter_type(label).ilike.%${searchQuery}%,
        sub_type(label).ilike.%${searchQuery}%
      `);
    }

    // Add sorting
    query = query.order(
      sortBy === 'matter_status.status'
        ? 'matter_status!inner.status'
        : sortBy === 'client_name'
          ? 'client(last_name)'
          : sortBy,
      { ascending: sortDirection === 'asc' }
    );

    // Add pagination
    query = query.range(from, to);

    const { data: matters, error, count } = await query;

    // Debug log for raw matters
    console.log('Raw matters:', JSON.stringify(matters, null, 2));

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the matter_status, priority, client_name, and new fields
    const transformedMatters = matters?.map(matter => {
      let priorityName: string | null = null;
      const priority = matter.priority as any;
      if (priority) {
        if (Array.isArray(priority)) {
          priorityName = priority[0]?.name ?? 'unspecified';
        } else if (typeof priority === 'object' && priority !== null) {
          priorityName = priority.name ?? 'unspecified';
        }
      } else {
        priorityName = 'unspecified';
      }
      // Matter type and sub-type
      let matterType = '';
      let subType = '';
      const type = matter.matter_type as any;
      const sub = matter.sub_type as any;
      if (type) {
        if (Array.isArray(type)) {
          matterType = type[0]?.label || '';
        } else if (typeof type === 'object' && type !== null) {
          matterType = type.label || '';
        }
      }
      if (sub) {
        if (Array.isArray(sub)) {
          subType = sub[0]?.label || '';
        } else if (typeof sub === 'object' && sub !== null) {
          subType = sub.label || '';
        }
      }
      // Tags
      let tags: string[] = [];
      const matterTags = matter.matter_tags as any[];
      if (Array.isArray(matterTags)) {
        tags = matterTags.map((t: any) => t.tag).filter(Boolean);
      }
      // Client avatar
      let clientAvatar = '';
      const client = matter.client as any;
      if (client) {
        if (Array.isArray(client)) {
          clientAvatar = client[0]?.avatar_url || '';
        } else if (typeof client === 'object' && client !== null) {
          clientAvatar = client.avatar_url || '';
        }
      }
      // Progress
      let progress = 0;
      if (matter.matter_progress) {
        if (Array.isArray(matter.matter_progress) && matter.matter_progress.length > 0) {
          const latestProgress = matter.matter_progress[0];
          progress = latestProgress.status === 'Completed' ? 100 : 
                    latestProgress.status === 'In Progress' ? 50 : 0;
        }
      }
      // Billing method, rate, and currency
      let billingMethod = '';
      let rate = undefined;
      let currency = '';
      if (matter.matter_billing && typeof matter.matter_billing === 'object') {
        const mb = Array.isArray(matter.matter_billing) ? matter.matter_billing[0] : matter.matter_billing;
        if (mb) {
          let bm = mb.billing_method;
          if (bm) {
            if (Array.isArray(bm)) {
              if (bm.length > 0 && typeof bm[0] === 'object') {
                billingMethod = (bm[0] as any).label || (bm[0] as any).value || '';
              }
            } else if (typeof bm === 'object') {
              billingMethod = (bm as any).label || (bm as any).value || '';
            }
          }
          rate = mb.rate_value;
          // Extract currency label or value
          let curr = mb.currency;
          if (curr) {
            if (Array.isArray(curr)) {
              if (curr.length > 0 && typeof curr[0] === 'object') {
                currency = (curr[0] as any).label || (curr[0] as any).value || '';
              }
            } else if (typeof curr === 'object') {
              currency = (curr as any).label || (curr as any).value || '';
            }
          }
        }
      }
      return {
        ...matter,
        status: matter.matter_status[0]?.status || 'active',
        priority: priorityName,
        client_name: Array.isArray(client)
          ? (client[0] ? `${client[0].first_name} ${client[0].last_name}`.trim() : '')
          : (client?.first_name ? `${client.first_name} ${client.last_name}`.trim() : ''),
        client_avatar_url: clientAvatar,
        matter_type: matterType,
        sub_type: subType,
        tags,
        progress,
        billing_method: billingMethod,
        rate,
        currency,
      } as MatterResponse;
    }) || [];

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
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
        },
      });
    }

    console.log('Query successful. Found', count, 'matters');
    
    return NextResponse.json({
      matters: transformedMatters,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    console.error('Unexpected error in matter search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 