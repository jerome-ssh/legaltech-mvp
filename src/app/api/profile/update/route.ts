import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    console.log('API route: Starting profile update request');
    const { userId } = auth();
    console.log('API route: Clerk userId:', userId);

    if (!userId) {
      console.error('API route: No userId found in auth');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('API route: Received request body:', JSON.stringify(body, null, 2));

    // Handle both camelCase and snake_case field names
    const professionalIds = body.professionalIds || body.professional_ids || [];

    // Format professional IDs as JSONB (without JSON.stringify)
    const formattedProfessionalIds = professionalIds.map(id => ({
      country: id.country || '',
      state: id.state || '',
      professional_id: id.professional_id || id.professionalId || '',
      year_issued: parseInt(id.year_issued || id.yearIssued) || 0,
      document_url: id.document_url || id.documentUrl || ''
    }));

    // Check user mapping
    const { data: mappingData, error: mappingError } = await supabase
      .from('user_mappings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    console.log('API route: User mapping check:', { mappingData, mappingError });

    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    console.log('API route: Profile check:', { profileData, profileError });

    // Check if role exists
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', body.role || 'attorney')
      .single();

    console.log('API route: Role check:', { roleData, roleError });

    if (roleError) {
      console.error('API route: Error checking role:', roleError);
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Prepare the parameters for the stored procedure
    const params = {
      p_clerk_user_id: userId,
      p_email: body.email,
      p_phone_number: body.phone_number,
      p_first_name: body.first_name,
      p_last_name: body.last_name,
      p_firm_name: body.firm_name,
      p_specialization: body.specialization,
      p_years_of_practice: parseInt(body.years_of_practice) || 0,
      p_avatar_url: body.avatar_url || '',
      p_address: body.address || '',
      p_home_address: body.home_address || '',
      p_gender: body.gender || '',
      p_role: body.role || 'attorney',
      p_onboarding_completed: true,
      p_professional_ids: formattedProfessionalIds
    };

    console.log('API route: Calling update_profile_with_related with params:', params);

    const { data, error } = await supabase.rpc('update_profile_with_related', params);

    console.log('API route: Stored procedure response:', { data, error });

    if (error) {
      console.error('Failed to update profile:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    // Clear any cached data
    const response = NextResponse.json({ 
      success: true, 
      data 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return response;
  } catch (error: any) {
    console.error('API route: Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}