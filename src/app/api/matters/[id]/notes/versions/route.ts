import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

// GET: List all versions for a note
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('matter_note_versions')
      .select('*')
      .eq('note_id', params.id)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ versions: data });
  } catch (error) {
    console.error('Error fetching note versions:', error);
    return NextResponse.json({ error: 'Failed to fetch note versions' }, { status: 500 });
  }
}

// POST: Save a new version for a note
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get Supabase user id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();
    if (profileError || !profileData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    const { title, content } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    // Get latest version number
    const { data: latest, error: latestError } = await supabase
      .from('matter_note_versions')
      .select('version_number')
      .eq('note_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();
    const nextVersion = latest && latest.version_number ? latest.version_number + 1 : 1;
    // Insert new version
    const { data, error } = await supabase
      .from('matter_note_versions')
      .insert({
        note_id: params.id,
        version_number: nextVersion,
        title,
        content,
        author_id: profileData.id
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ version: data });
  } catch (error) {
    console.error('Error saving note version:', error);
    return NextResponse.json({ error: 'Failed to save note version' }, { status: 500 });
  }
} 