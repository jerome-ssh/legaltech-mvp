import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Type definitions
interface MatterBilling {
  hours_logged_manual: number | null;
  hours_logged_auto: number | null;
  rate_value: number | null;
  total_billed: number | null;
}

interface Task {
  status: string;
  due_date: string;
  completed_at: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all analytics data for the matter in parallel
    const [
      outcomesResult,
      riskResult,
      efficiencyResult,
      notificationsResult,
      aiInsightsResult,
      tasksResult,
      billingResult
    ] = await Promise.all([
      // Matter outcomes
      supabase
        .from('matter_outcomes')
        .select(`
          *,
          judge:judges(name, specialization),
          court:courts(name, jurisdiction)
        `)
        .eq('matter_id', params.id)
        .single(),

      // Risk assessment
      supabase
        .from('matter_risk_assessment')
        .select('*')
        .eq('matter_id', params.id)
        .single(),

      // Efficiency metrics
      supabase
        .from('matter_efficiency_metrics')
        .select('*')
        .eq('matter_id', params.id)
        .single(),

      // Notifications
      supabase
        .from('matter_notifications')
        .select('*')
        .eq('matter_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // AI insights
      supabase
        .from('matter_ai_insights')
        .select('*')
        .eq('matter_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // Tasks for efficiency calculation
      supabase
        .from('tasks')
        .select('status, due_date, completed_at')
        .eq('matter_id', params.id),

      // Billing for financial metrics
      supabase
        .from('matter_billing')
        .select('hours_logged_manual, hours_logged_auto, rate_value, total_billed')
        .eq('matter_id', params.id)
        .single()
    ]);

    // Process tasks for efficiency metrics
    const tasks = (tasksResult.data || []) as Task[];
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length;

    // Calculate task completion rate
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task duration
    const completedTaskDurations = tasks
      .filter(t => t.status === 'completed' && t.completed_at)
      .map(t => {
        const start = new Date(t.due_date).getTime();
        const end = new Date(t.completed_at!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
      });
    const averageTaskDuration = completedTaskDurations.length > 0
      ? completedTaskDurations.reduce((a, b) => a + b, 0) / completedTaskDurations.length
      : 0;

    // Calculate efficiency score (weighted combination of completion rate and duration)
    const efficiencyScore = Math.round(
      (taskCompletionRate * 0.7) + // 70% weight to completion rate
      (Math.max(0, 100 - (averageTaskDuration * 10)) * 0.3) // 30% weight to duration (penalize longer durations)
    );

    // Process billing data
    const billing = (billingResult.data || {}) as MatterBilling;
    const totalHours = (billing.hours_logged_manual || 0) + (billing.hours_logged_auto || 0);
    const predictedBilling = billing.rate_value ? billing.rate_value * totalHours : 0;
    const actualBilling = billing.total_billed || 0;
    const billingEfficiency = predictedBilling > 0 
      ? Math.round((actualBilling / predictedBilling) * 100)
      : 0;

    // Compile all analytics data
    const analytics = {
      outcomes: outcomesResult.data || null,
      risk: {
        ...riskResult.data,
        riskLevel: riskResult.data?.risk_score > 70 ? 'High' : 
                  riskResult.data?.risk_score > 30 ? 'Medium' : 'Low'
      },
      efficiency: {
        ...efficiencyResult.data,
        taskCompletionRate,
        averageTaskDuration,
        efficiencyScore,
        completedTasks,
        totalTasks,
        overdueTasks
      },
      notifications: notificationsResult.data || [],
      aiInsights: aiInsightsResult.data || [],
      financial: {
        totalHours,
        predictedBilling,
        actualBilling,
        billingEfficiency,
        hoursLoggedManual: billing.hours_logged_manual || 0,
        hoursLoggedAuto: billing.hours_logged_auto || 0
      }
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching matter analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 