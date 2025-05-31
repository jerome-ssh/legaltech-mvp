import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

// POST: Upload an audio recording
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    if (!file) {
      return NextResponse.json({ error: 'No audio uploaded' }, { status: 400 });
    }
    // Upload to Supabase Storage
    const filePath = `matter_notes/${params.id}/audio_${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, { upsert: false });
    if (storageError) throw storageError;
    const fileUrl = storageData?.path;
    // Insert into matter_note_attachments
    const { data, error } = await supabase
      .from('matter_note_attachments')
      .insert({ note_id: params.id, file_url: fileUrl, file_type: 'audio' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ audio: data });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
  }
}

// GET: List audio recordings for a note
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('matter_note_attachments')
      .select('*')
      .eq('note_id', params.id)
      .eq('file_type', 'audio')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ audio: data });
  } catch (error) {
    console.error('Error fetching audio:', error);
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
  }
}

// DELETE: Remove an audio recording (by attachment id)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { attachmentId } = await request.json();
    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }
    // Delete from DB
    const { error } = await supabase
      .from('matter_note_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('file_type', 'audio');
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting audio:', error);
    return NextResponse.json({ error: 'Failed to delete audio' }, { status: 500 });
  }
} 