import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, getProfileId } from '@/lib/supabase';

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('id');

    // If threadId is provided, get messages for that thread
    if (threadId) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Messages fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Otherwise, get all message threads
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Messages fetch error:', error);
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
    const { thread_id, content, recipient } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        profile_id: profileId,
        thread_id,
        content,
        recipient,
        status: 'unread'
      })
      .select()
      .single();

    if (error) {
      console.error('Message creation error:', error);
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
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if the message exists and belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Message fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Message update error:', error);
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
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if the message exists and belongs to the user
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Message fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Message deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}