import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, handleSupabaseError } from '@/lib/supabase';

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('GET /api/leads - User ID:', userId);
    
    if (!userId) {
      console.log('Unauthorized: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('No leads found for user:', userId);
      return NextResponse.json([]);
    }

    console.log('Successfully fetched leads:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('POST /api/leads - User ID:', userId);
    
    if (!userId) {
      console.log('Unauthorized: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    if (!body.name) {
      console.log('Bad request: Missing required field "name"');
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...body,
          user_id: userId,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    console.log('Successfully created lead:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('PUT /api/leads userId:', userId);
    if (!userId) {
      console.log('Unauthorized: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('PUT /api/leads body:', body);
    const { id, ...updates } = body;

    if (!id) {
      console.log('Bad request: Missing lead ID');
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('Lead not found or unauthorized:', id);
      return NextResponse.json(
        { error: 'Lead not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log('Successfully updated lead:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('DELETE /api/leads userId:', userId);
    if (!userId) {
      console.log('Unauthorized: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/leads id:', id);

    if (!id) {
      console.log('Bad request: Missing lead ID');
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      );
    }

    console.log('Successfully deleted lead:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 