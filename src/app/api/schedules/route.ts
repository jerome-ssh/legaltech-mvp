import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, getProfileId } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = supabase
      .from('schedules')
      .select('*')
      .eq('profile_id', profileId);

    if (start && end) {
      query = query
        .gte('start_time', start)
        .lte('end_time', end);
    }

    // Auto-delete expired schedules (workaround for Supabase Free)
    const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error: deleteError } = await supabaseClient
      .from('schedules')
      .delete()
      .lt('end_time', new Date().toISOString());
    if (deleteError) {
      console.error('Error auto-deleting expired schedules:', deleteError);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    // Debug: Log the result of the GET query
    console.log('[DEBUG][GET /api/schedules] profileId:', profileId, 'start:', start, 'end:', end, 'data:', data, 'error:', error);

    if (error) {
      console.error('Schedules fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    const body = await req.json();
    // Debug: Log the full request body
    console.log('[DEBUG][POST /api/schedules] Request body:', body);
    const { 
      title, 
      start_time, 
      end_time, 
      description, 
      type = 'meeting',
      status = 'scheduled',
      participants = [],
      location,
      is_recurring = false,
      recurrence_pattern,
      reminder_time,
      reminder_type = [],
      metadata = null
    } = body;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert({
        profile_id: profileId,
        title,
        start_time,
        end_time,
        description,
        type,
        status,
        participants,
        location,
        is_recurring,
        recurrence_pattern,
        reminder_time,
        reminder_type,
        reminder_sent: false,
        metadata // Save metadata
      })
      .select()
      .single();

    // Debug: Log the result of the insert operation
    console.log('[DEBUG][POST /api/schedules] Insert result:', { data, error });

    if (error) {
      console.error('Schedule creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Check if the schedule exists and belongs to the user
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Schedule fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Schedule update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // Check if the schedule exists and belongs to the user
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Schedule fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Schedule deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}