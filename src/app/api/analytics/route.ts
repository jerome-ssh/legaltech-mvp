import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Create Supabase client with service role key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // Get the user ID from Clerk
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel with proper error handling
    const [
      casesResult,
      typesResult,
      billingResult,
      tasksResult,
      statusResult,
      feedbackResult
    ] = await Promise.all([
      supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: true })
        .throwOnError(),
      supabase
        .from('case_types')
        .select('*')
        .throwOnError(),
      supabase
        .from('billing')
        .select('*')
        .order('created_at', { ascending: true })
        .throwOnError(),
      supabase
        .from('tasks')
        .select('*')
        .eq('is_recurring', true)
        .throwOnError(),
      supabase
        .from('cases')
        .select('status')
        .throwOnError(),
      supabase
        .from('client_feedback')
        .select('rating')
        .throwOnError()
    ]);

    // Validate and process the data
    const response = {
      cases: casesResult.data || [],
      types: typesResult.data || [],
      billing: billingResult.data || [],
      tasks: tasksResult.data || [],
      statusData: statusResult.data || [],
      feedbackData: feedbackResult.data || []
    };

    // Add metadata about the data
    const metadata = {
      totalCases: response.cases.length,
      totalBillingRecords: response.billing.length,
      totalTasks: response.tasks.length,
      totalFeedback: response.feedbackData.length,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      ...response,
      metadata
    });

  } catch (error) {
    console.error('Error in analytics API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Required database tables do not exist. Please run migrations first.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Permission denied. Please check your database permissions.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching analytics data' },
      { status: 500 }
    );
  }
} 