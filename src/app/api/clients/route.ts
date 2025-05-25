import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, getProfileId } from '@/lib/supabase';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const clientSchema = z.object({
  title_id: z.number(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  address: z.string().optional(),
  preferred_language_id: z.number(),
  client_type_id: z.number(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid international phone number'),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileId = await getProfileId(userId);

    // Get the clients using the profile ID
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Clients fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      console.error('Auth error: No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received client POST body:', body);
    const parseResult = clientSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Client validation error:', parseResult.error.errors);
      return NextResponse.json({ error: 'Invalid client data', details: parseResult.error.errors }, { status: 400 });
    }
    const clientData = parseResult.data;

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create the client
    const { data: client, error } = await supabaseClient
      .from('clients')
      .insert([
        {
          title_id: clientData.title_id,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          address: clientData.address,
          preferred_language_id: clientData.preferred_language_id,
          client_type_id: clientData.client_type_id,
          phone_number: clientData.phone_number,
          profile_id: profile.id,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: client.id });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if the client exists and belongs to the user
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Client fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Client update error:', error);
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
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if the client exists and belongs to the user
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('profile_id', profileId)
      .single();

    if (fetchError) {
      console.error('Client fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Client deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 