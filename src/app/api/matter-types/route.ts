import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matter-types - Get all matter types and their sub-types
export async function GET() {
  try {
    // Fetch matter types
    const { data: matterTypes, error: matterTypesError } = await supabase
      .from('matter_types')
      .select('*')
      .order('label');

    if (matterTypesError) {
      return NextResponse.json({ error: matterTypesError.message }, { status: 500 });
    }

    // Fetch matter sub-types
    const { data: matterSubTypes, error: matterSubTypesError } = await supabase
      .from('matter_sub_types')
      .select('*')
      .order('label');

    if (matterSubTypesError) {
      return NextResponse.json({ error: matterSubTypesError.message }, { status: 500 });
    }

    // Format the response
    const formattedMatterTypes = matterTypes.map(type => ({
      id: type.id,
      value: type.value,
      label: type.label,
      subTypes: matterSubTypes
        .filter(subType => subType.type_id === type.id)
        .map(subType => ({
          id: subType.id,
          value: subType.value,
          label: subType.label
        }))
    }));

    return NextResponse.json({ matterTypes: formattedMatterTypes });
  } catch (error) {
    console.error('Error fetching matter types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 