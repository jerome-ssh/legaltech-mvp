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

    // Get profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: true, score: 0 },
        { status: 200 }
      );
    }

    // Start with 30% baseline for having an account
    let efficiency = 30;

    // Add up to 40% for profile completeness
    const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'firm_name', 'specialization', 'years_of_practice', 'address'];
    const completedFields = requiredFields.filter(field => profile[field]);
    const profileBonus = Math.round((completedFields.length / requiredFields.length) * 40);
    efficiency += profileBonus;

    // Add 15% for having professional IDs/certifications
    const { data: professionalIds } = await supabaseAdmin
      .from('professional_ids')
      .select('certifications')
      .eq('profile_id', profileId);

    if (professionalIds && professionalIds.length > 0) {
      const hasCertifications = professionalIds.some(
        record => record.certifications && record.certifications.length > 0
      );

      if (hasCertifications) {
        efficiency += 15;
      }
    }

    // Add 15% if avatar is present
    if (profile.avatar_url) {
      efficiency += 15;
    }

    const score = Math.min(100, efficiency);

    return NextResponse.json(
      { success: true, score },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in workflow API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 