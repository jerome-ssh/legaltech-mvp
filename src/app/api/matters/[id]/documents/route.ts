import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DEBUG: API called for matter documents', { matterId: params.id });
    // Clerk authentication
    const { userId } = auth();
    console.log('DEBUG: Clerk userId:', userId);
    if (!userId) {
      console.error('DEBUG: No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, clerk_id')
      .eq('clerk_id', userId)
      .single();
    console.log('DEBUG: Profile lookup result:', profile, 'Error:', profileError);
    if (profileError || !profile) {
      console.error('DEBUG: Profile not found for userId', userId);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Verify the matter exists and user has access
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id, profile_id')
      .eq('id', params.id)
      .eq('profile_id', profile.id)
      .single();
    console.log('DEBUG: Matter lookup result:', matter, 'Error:', matterError);
    if (matterError || !matter) {
      console.error('DEBUG: Matter not found or not accessible for profile', profile.id);
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Fetch documents for the matter
    const { data: documents, error: documentsError } = await supabase
      .from('matter_documents')
      .select('*')
      .eq('matter_id', params.id)
      .order('uploaded_at', { ascending: false });
    console.log('DEBUG: Documents fetch result:', documents, 'Error:', documentsError);
    if (documentsError) {
      console.error('DEBUG: Error fetching documents:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('DEBUG: Unexpected error in documents API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 