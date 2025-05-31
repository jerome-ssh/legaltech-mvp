import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  console.log('--- API PUT /api/matters/[id]/notes/[noteId] route hit ---');
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
    console.log('API PUT /api/matters/[id]/notes/[noteId] - incoming:', { title, content, matter_id: params.id, note_id: params.noteId });

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to the matter
    const { data: existingNote, error: verifyError } = await supabase
      .from('matter_notes')
      .select('id')
      .eq('id', params.noteId)
      .eq('matter_id', params.id)
      .single();

    if (verifyError || !existingNote) {
      return NextResponse.json(
        { error: 'Note not found or does not belong to this matter' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('matter_notes')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.noteId)
      .select()
      .single();

    console.log('Supabase update result:', { data, error });

    if (error) throw error;

    return NextResponse.json({ note: data });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  console.log('--- API DELETE /api/matters/[id]/notes/[noteId] route hit ---');
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

    // Verify the note belongs to the matter
    const { data: existingNote, error: verifyError } = await supabase
      .from('matter_notes')
      .select('id')
      .eq('id', params.noteId)
      .eq('matter_id', params.id)
      .single();

    if (verifyError || !existingNote) {
      return NextResponse.json(
        { error: 'Note not found or does not belong to this matter' },
        { status: 404 }
      );
    }

    // Delete the note
    const { error } = await supabase
      .from('matter_notes')
      .delete()
      .eq('id', params.noteId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
} 