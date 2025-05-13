import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const { phoneNumber } = await request.json();

        if (!phoneNumber) {
            return NextResponse.json(
                { 
                    success: false,
                    error: "Phone number is required",
                    code: "MISSING_PHONE_NUMBER"
                },
                { status: 400 }
            );
        }

        // Check if phone number exists in profiles
        const { data: existingProfile, error } = await supabaseAdmin
            .from('profiles')
            .select('clerk_id')
            .eq('phone_number', phoneNumber)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking phone number:', error);
            return NextResponse.json(
                { 
                    success: false,
                    error: "Failed to check phone number",
                    details: error.message
                },
                { status: 500 }
            );
        }

        // If profile exists, phone number is in use
        if (existingProfile) {
            return NextResponse.json(
                { 
                    success: false,
                    error: "Phone number is already associated with another account",
                    code: "PHONE_NUMBER_IN_USE"
                },
                { status: 400 }
            );
        }

        // Phone number is available
        return NextResponse.json(
            { 
                success: true,
                message: "Phone number is available"
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Unexpected error in phone number check:', error);
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