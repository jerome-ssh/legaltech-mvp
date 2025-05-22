import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, getProfileId } from '@/lib/supabase';

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

    const { data, error } = await query.order('start_time', { ascending: true });

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
      reminder_type = []
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
        reminder_sent: false
      })
      .select()
      .single();

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