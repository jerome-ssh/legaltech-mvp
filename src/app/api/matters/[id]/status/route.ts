import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Valid matter statuses
const VALID_STATUSES = ['active', 'pending', 'closed', 'archived'];

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Update matter status
    const { data, error } = await supabase
      .from('cases')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'closed' && { end_date: new Date().toISOString() })
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating matter status:', error);
      return NextResponse.json(
        { error: 'Failed to update matter status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // If status is being changed to closed, generate a final AI summary
    if (status === 'closed') {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matterId: params.id }),
        });

        if (!response.ok) {
          console.error('Failed to generate final AI summary');
        }
      } catch (error) {
        console.error('Error generating final AI summary:', error);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in matter status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 