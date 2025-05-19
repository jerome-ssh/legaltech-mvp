import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matterId } = await req.json();
    if (!matterId) {
      return NextResponse.json({ error: 'Matter ID is required' }, { status: 400 });
    }

    // Fetch matter details
    const { data: matter, error: matterError } = await supabase
      .from('cases')
      .select(`
        *,
        documents (*),
        notes (*),
        tasks (*),
        messages (*)
      `)
      .eq('id', matterId)
      .eq('user_id', userId)
      .single();

    if (matterError) {
      console.error('Error fetching matter:', matterError);
      return NextResponse.json({ error: 'Failed to fetch matter details' }, { status: 500 });
    }

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Prepare context for AI summary
    const context = {
      title: matter.title,
      status: matter.status,
      description: matter.description,
      documents: matter.documents?.map((doc: any) => ({
        title: doc.title,
        status: doc.status,
        created_at: doc.created_at
      })),
      notes: matter.notes?.map((note: any) => ({
        content: note.content,
        created_at: note.created_at
      })),
      tasks: matter.tasks?.map((task: any) => ({
        title: task.title,
        status: task.status,
        due_date: task.due_date
      })),
      messages: matter.messages?.map((msg: any) => ({
        content: msg.content,
        created_at: msg.created_at
      }))
    };

    // Generate AI summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a legal assistant that provides concise summaries of legal matters. Focus on key developments, important documents, pending tasks, and overall progress."
        },
        {
          role: "user",
          content: `Please provide a comprehensive summary of this legal matter:\n${JSON.stringify(context, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const summary = completion.choices[0].message.content;

    // Store the summary in the database
    const { error: updateError } = await supabase
      .from('cases')
      .update({ ai_summary: summary })
      .eq('id', matterId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating matter with summary:', updateError);
      return NextResponse.json({ error: 'Failed to store summary' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 