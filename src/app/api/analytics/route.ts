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

    // Fetch all data in parallel, filtered by userId
    const [
      mattersResult,
      typesResult,
      billingResult,
      tasksResult,
      statusResult,
      feedbackResult
    ] = await Promise.all([
      // Matters by month
      supabase
        .from('matters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),

      // Case types
      supabase
        .from('matters')
        .select('case_type')
        .eq('user_id', userId),

      // Billing data
      supabase
        .from('matters')
        .select('billing_amount, status')
        .eq('user_id', userId),

      // Tasks
      supabase
        .from('tasks')
        .select('status, due_date')
        .eq('user_id', userId),

      // Case status
      supabase
        .from('matters')
        .select('status')
        .eq('user_id', userId),

      // Client feedback
      supabase
        .from('client_feedback')
        .select('rating')
        .eq('user_id', userId)
    ]);

    // Process matters by month
    const mattersByMonth = mattersResult.data?.reduce((acc: any, matter: any) => {
      const month = new Date(matter.created_at).toLocaleString('default', { month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Process case types
    const caseTypes = typesResult.data?.reduce((acc: any, matter: any) => {
      acc[matter.case_type] = (acc[matter.case_type] || 0) + 1;
      return acc;
    }, {});

    // Process billing data
    const billingData = billingResult.data?.reduce((acc: any, matter: any) => {
      if (matter.status === 'completed') {
        acc.totalBilled += matter.billing_amount || 0;
        acc.completedCases++;
      }
      return acc;
    }, { totalBilled: 0, completedCases: 0 });

    // Process tasks
    const tasks = tasksResult.data?.reduce((acc: any, task: any) => {
      if (task.status === 'completed') {
        acc.completed++;
      } else if (task.status === 'pending') {
        acc.pending++;
      }
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate < new Date()) {
          acc.overdue++;
        }
      }
      return acc;
    }, { completed: 0, pending: 0, overdue: 0 });

    // Process case status
    const caseStatus = statusResult.data?.reduce((acc: any, matter: any) => {
      acc[matter.status] = (acc[matter.status] || 0) + 1;
      return acc;
    }, {});

    // Process client feedback
    const feedback = feedbackResult.data?.reduce((acc: any, feedback: any) => {
      acc.total += feedback.rating;
      acc.count++;
      return acc;
    }, { total: 0, count: 0 });

    return NextResponse.json({
      mattersByMonth,
      caseTypes,
      billingData,
      tasks,
      caseStatus,
      averageRating: feedback.count > 0 ? feedback.total / feedback.count : 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 