import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, recipient } = body;

    if (!content || !recipient) {
      return NextResponse.json(
        { error: 'Content and recipient are required' },
        { status: 400 }
      );
    }

    // First, verify the thread exists and user has access
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Message thread not found or access denied' },
        { status: 404 }
      );
    }

    // Create the new message
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          thread_id: params.id,
          content,
          sender: userId,
          recipient,
          user_id: userId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update the thread's last_message
    const { error: updateError } = await supabase
      .from('message_threads')
      .update({ last_message: content })
      .eq('id', params.id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating thread:', updateError);
      // Don't return error here as the message was created successfully
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 