import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

async function getOrCreateProfile(userId: string) {
  // First try to get the profile using the regular client
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (profileError && profileError.code === 'PGRST116') {
    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        clerk_id: userId,
        role: 'user',
        onboarding_completed: false
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      throw new Error('Failed to create profile');
    }

    if (!newProfile) {
      throw new Error('Failed to create profile - no data returned');
    }

    return { id: newProfile.id };
  }

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw new Error('Failed to fetch profile');
  }

  return profile;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('GET /api/matters - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(userId);

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch matters' },
        { status: 500 }
      );
    }

    console.log('Successfully fetched matters:', data?.length || 0);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Unexpected error in GET /api/matters:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('POST /api/matters - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(userId);

    const body = await req.json();
    console.log('Request body:', body);

    const { data, error } = await supabase
      .from('cases')
      .insert([
        {
          ...body,
          profile_id: profile.id,
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create matter' },
        { status: 500 }
      );
    }

    console.log('Successfully created matter:', data);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/matters:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('PUT /api/matters userId:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(userId);

    const body = await req.json();
    console.log('PUT /api/matters body:', body);
    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', profile.id)
      .select()
      .single();

    console.log('Supabase update matter data:', data);
    console.log('Supabase update matter error:', error);

    if (error) {
      console.error('Error updating matter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Error in matters API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('DELETE /api/matters userId:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(userId);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('DELETE /api/matters id:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Matter ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
      .eq('profile_id', profile.id);

    console.log('Supabase delete matter error:', error);

    if (error) {
      console.error('Error deleting matter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in matters API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 