import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { Resend } from 'resend';
import { supabase } from "@/lib/supabase";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile from Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Generate email HTML using our template
    const emailHtml = WelcomeEmail({
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      firmName: profile.firm_name,
      specialization: profile.specialization,
      yearsOfPractice: profile.years_of_practice,
    });

    // Send welcome email using Resend's default domain
    await resend.emails.send({
      from: 'LegalTech <onboarding@resend.dev>', // Using Resend's default domain
      to: profile.email,
      subject: 'Welcome to LegalTech! 🎉',
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }
} 