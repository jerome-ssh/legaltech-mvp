import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the user's profile ID from the clerk_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get the user's metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("user_metrics")
      .select("*")
      .eq("profile_id", profile.id)
      .single();

    if (metricsError) {
      return NextResponse.json(
        { error: metricsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Error in GET /api/user-metrics:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    // Get the user's profile ID from the clerk_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Update the user's metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("user_metrics")
      .upsert({
        profile_id: profile.id,
        ...body,
      })
      .select()
      .single();

    if (metricsError) {
      return NextResponse.json(
        { error: metricsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Error in POST /api/user-metrics:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 