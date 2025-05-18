import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, handleSupabaseError } from '@/lib/supabase';

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('GET /api/cases - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cases' },
        { status: 500 }
      );
    }

    console.log('Successfully fetched cases:', data?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('POST /api/cases - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { data, error } = await supabase
      .from('cases')
      .insert([
        {
          ...body,
          user_id: userId,
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create case' },
        { status: 500 }
      );
    }

    console.log('Successfully created case:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('PUT /api/cases userId:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('PUT /api/cases body:', body);
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    console.log('Supabase update case data:', data);
    console.log('Supabase update case error:', error);

    if (error) {
      console.error('Error updating case:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in cases API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('DELETE /api/cases userId:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/cases id:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    console.log('Supabase delete case error:', error);

    if (error) {
      console.error('Error deleting case:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cases API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 