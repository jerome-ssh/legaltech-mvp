import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('status')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    if (!documents?.length) {
      return NextResponse.json(
        { success: true, score: 0 },
        { status: 200 }
      );
    }

    const compliantDocs = documents.filter(doc => doc.status === 'approved');
    const score = Math.round((compliantDocs.length / documents.length) * 100);

    return NextResponse.json(
      { success: true, score },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in compliance API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 