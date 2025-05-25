import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: billingFrequencies, error } = await supabase
      .rpc('get_active_billing_frequency_options');

    if (error) {
      console.error('Error fetching billing frequencies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch billing frequencies' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const options = billingFrequencies.map((frequency: any) => ({
      id: frequency.id,
      value: frequency.value,
      label: frequency.label,
      description: frequency.description
    }));

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error in billing frequencies route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 