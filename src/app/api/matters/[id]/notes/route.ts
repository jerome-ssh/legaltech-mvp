import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("matter_notes")
      .select("id, title, content, author_id, created_at")
      .eq("matter_id", params.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ notes: data });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('--- API POST /api/matters/[id]/notes route hit ---');
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, get the Supabase user ID from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { title, content } = await request.json();
    console.log('API POST /api/matters/[id]/notes - incoming:', { title, content, matter_id: params.id });

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("matter_notes")
      .insert({
        matter_id: params.id,
        author_id: profileData.id,
        title,
        content
      })
      .select();

    console.log('Supabase insert result:', { data, error });

    if (error) throw error;

    return NextResponse.json({ note: data });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
} 