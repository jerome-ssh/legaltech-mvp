import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = await request.json();

    // Store preferences in database
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        preferences: preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to store notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to store preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get preferences from database
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Failed to fetch notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data?.preferences || []);
  } catch (error) {
    console.error('Error in notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 