import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface MatterOutcome {
  outcome: string;
  count: number;
}

interface CourtPerformance {
  court_name: string;
  win_rate: number;
  total_cases: number;
}

interface JudgePerformance {
  judge_name: string;
  win_rate: number;
  total_cases: number;
}

interface RiskDistribution {
  risk_level: string;
  count: number;
}

interface EfficiencyTrend {
  month: string;
  average_efficiency: number;
  average_completion_rate: number;
}

interface Court {
  name: string;
}

interface Judge {
  name: string;
}

interface MatterOutcomeWithRelations {
  outcome: string;
  judge: Judge;
  court: Court;
}

interface SupabaseMatterOutcome {
  outcome: string;
  judge: { name: string }[];
  court: { name: string }[];
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch all analytics data in parallel
    const [
      outcomesResult,
      riskResult,
      efficiencyResult,
      billingResult,
      tasksResult
    ] = await Promise.all([
      // Matter outcomes with judge and court info
      supabase
        .from('matter_outcomes')
        .select(`
          outcome,
          judge:judges(name),
          court:courts(name)
        `)
        .eq('profile_id', profile.id),

      // Risk assessments
      supabase
        .from('matter_risk_assessment')
        .select('risk_score, compliance_status')
        .eq('profile_id', profile.id),

      // Efficiency metrics
      supabase
        .from('matter_efficiency_metrics')
        .select('task_completion_rate, efficiency_score, created_at')
        .eq('profile_id', profile.id),

      // Billing data
      supabase
        .from('matter_billing')
        .select('hours_logged_manual, hours_logged_auto, total_billed')
        .eq('profile_id', profile.id),

      // Tasks
      supabase
        .from('tasks')
        .select('status, due_date, completed_at')
        .eq('profile_id', profile.id)
    ]);

    // Process outcomes
    const outcomes = (outcomesResult.data || []) as SupabaseMatterOutcome[];
    const outcomeDistribution = outcomes.reduce((acc: Record<string, number>, curr) => {
      acc[curr.outcome] = (acc[curr.outcome] || 0) + 1;
      return acc;
    }, {});

    // Process court performance
    const courtPerformance = outcomes.reduce((acc: Record<string, { wins: number; total: number }>, curr) => {
      const courtName = curr.court?.[0]?.name;
      if (!courtName) return acc;
      if (!acc[courtName]) {
        acc[courtName] = { wins: 0, total: 0 };
      }
      acc[courtName].total++;
      if (curr.outcome === 'Won') {
        acc[courtName].wins++;
      }
      return acc;
    }, {});

    const courtStats: CourtPerformance[] = Object.entries(courtPerformance).map(([name, stats]) => ({
      court_name: name,
      win_rate: (stats.wins / stats.total) * 100,
      total_cases: stats.total
    }));

    // Process judge performance
    const judgePerformance = outcomes.reduce((acc: Record<string, { wins: number; total: number }>, curr) => {
      const judgeName = curr.judge?.[0]?.name;
      if (!judgeName) return acc;
      if (!acc[judgeName]) {
        acc[judgeName] = { wins: 0, total: 0 };
      }
      acc[judgeName].total++;
      if (curr.outcome === 'Won') {
        acc[judgeName].wins++;
      }
      return acc;
    }, {});

    const judgeStats: JudgePerformance[] = Object.entries(judgePerformance).map(([name, stats]) => ({
      judge_name: name,
      win_rate: (stats.wins / stats.total) * 100,
      total_cases: stats.total
    }));

    // Process risk distribution
    const risks = riskResult.data || [];
    const riskDistribution: RiskDistribution[] = [
      { risk_level: 'Low', count: risks.filter(r => r.risk_score <= 30).length },
      { risk_level: 'Medium', count: risks.filter(r => r.risk_score > 30 && r.risk_score <= 70).length },
      { risk_level: 'High', count: risks.filter(r => r.risk_score > 70).length }
    ];

    // Process efficiency trends
    const efficiency = efficiencyResult.data || [];
    const efficiencyByMonth = efficiency.reduce((acc: Record<string, { efficiency: number[]; completion: number[] }>, curr) => {
      const month = new Date(curr.created_at).toLocaleString('default', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { efficiency: [], completion: [] };
      }
      acc[month].efficiency.push(curr.efficiency_score);
      acc[month].completion.push(curr.task_completion_rate);
      return acc;
    }, {});

    const efficiencyTrends: EfficiencyTrend[] = Object.entries(efficiencyByMonth).map(([month, data]) => ({
      month,
      average_efficiency: data.efficiency.reduce((a, b) => a + b, 0) / data.efficiency.length,
      average_completion_rate: data.completion.reduce((a, b) => a + b, 0) / data.completion.length
    }));

    // Process billing metrics
    const billing = billingResult.data || [];
    const totalHours = billing.reduce((sum, b) => 
      sum + (b.hours_logged_manual || 0) + (b.hours_logged_auto || 0), 0);
    const totalBilled = billing.reduce((sum, b) => sum + (b.total_billed || 0), 0);

    // Process task metrics
    const tasks = tasksResult.data || [];
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length;

    // Compile all analytics
    const analytics = {
      outcomes: {
        distribution: outcomeDistribution,
        total_cases: outcomes.length,
        win_rate: outcomes.filter(o => o.outcome === 'Won').length / outcomes.length * 100
      },
      court_performance: courtStats,
      judge_performance: judgeStats,
      risk_distribution: riskDistribution,
      efficiency_trends: efficiencyTrends,
      billing_metrics: {
        total_hours: totalHours,
        total_billed: totalBilled,
        average_hourly_rate: totalHours > 0 ? totalBilled / totalHours : 0
      },
      task_metrics: {
        completion_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        overdue_rate: totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks
      }
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 