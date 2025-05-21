import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch roles from the database
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    // Ensure we return a valid JSON array
    if (!Array.isArray(roles)) {
      console.error('Invalid roles data format:', roles);
      return NextResponse.json(
        { error: 'Invalid roles data format' },
        { status: 500 }
      );
    }

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error in roles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 