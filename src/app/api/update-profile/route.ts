import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('API route: Starting profile update request');
  
  try {
    const { userId } = auth();
    console.log('API route: Auth check - userId:', userId);

    if (!userId) {
      console.log('API route: No userId found in auth');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('API route: Received request body:', body);
    } catch (parseError) {
      console.error('API route: Failed to parse request body:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    const { barNumber, firmName, specialization, years_of_practice } = body;

    console.log('API route: Updating Supabase profile for userId:', userId);
    // Update profile in Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        bar_number: barNumber,
        firm_name: firmName,
        specialization: specialization,
        years_of_practice: years_of_practice,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('API route: Supabase error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to update profile", 
          details: error.message 
        },
        { status: 500 }
      );
    }

    if (!profile) {
      console.log('API route: No profile found for userId:', userId);
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log('API route: Profile updated successfully:', profile);
    return NextResponse.json({ 
      success: true,
      profile 
    });
  } catch (error) {
    console.error('API route: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 