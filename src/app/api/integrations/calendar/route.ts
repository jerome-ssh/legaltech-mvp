import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the user's firm ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: firmAssociation } = await supabase
      .from('law_firm_associations')
      .select('law_firm_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!firmAssociation) {
      return NextResponse.json({ error: 'No active firm association' }, { status: 403 });
    }

    // Get calendar integrations for the firm
    const { data: integrations, error } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('firm_id', firmAssociation.law_firm_id);

    if (error) {
      console.error('Error fetching calendar integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Error in GET /api/integrations/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get the user's firm ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: firmAssociation } = await supabase
      .from('law_firm_associations')
      .select('law_firm_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!firmAssociation) {
      return NextResponse.json({ error: 'No active firm association' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { provider, credentials } = body;

    if (!provider || !credentials) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Add the integration
    const { data: integration, error } = await supabase
      .from('calendar_sync_settings')
      .insert({
        firm_id: firmAssociation.law_firm_id,
        provider,
        credentials,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding calendar integration:', error);
      return NextResponse.json({ error: 'Failed to add integration' }, { status: 500 });
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error in POST /api/integrations/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 