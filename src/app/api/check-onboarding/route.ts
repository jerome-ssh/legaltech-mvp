import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return NextResponse.json(
        { error: "Failed to check onboarding status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      onboardingCompleted: profile?.onboarding_completed || false
    });
  } catch (error) {
    console.error('Error in check-onboarding:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 