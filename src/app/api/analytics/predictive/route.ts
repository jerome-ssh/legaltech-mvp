import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface MatterOutcome {
  outcome: string;
  court: { name: string }[];
  judge: { name: string }[];
  matter_type: string;
  created_at: string;
  updated_at: string;
}

interface TaskMetrics {
  total_tasks: number;
  completed_tasks: number;
  average_completion_time: number;
}

interface BillingMetrics {
  total_hours: number;
  total_billed: number;
  average_hourly_rate: number;
}

interface PredictiveInsights {
  outcome_prediction: {
    predicted_outcome: string;
    confidence_score: number;
    factors: {
      factor: string;
      impact: number;
    }[];
  };
  timeline_prediction: {
    estimated_completion_date: string;
    confidence_score: number;
    factors: {
      factor: string;
      impact: number;
    }[];
  };
  resource_prediction: {
    estimated_hours: number;
    estimated_cost: number;
    confidence_score: number;
    factors: {
      factor: string;
      impact: number;
    }[];
  };
  risk_assessment: {
    risk_level: string;
    risk_score: number;
    key_risks: {
      risk: string;
      severity: number;
      mitigation_strategy: string;
    }[];
  };
}

export async function GET(request: Request) {
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

    // Get matter_id from query parameters
    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get('matter_id');

    if (!matterId) {
      return NextResponse.json({ error: 'Matter ID is required' }, { status: 400 });
    }

    // Fetch historical data for similar matters
    const [
      outcomesResult,
      tasksResult,
      billingResult,
      currentMatterResult
    ] = await Promise.all([
      // Historical outcomes
      supabase
        .from('matter_outcomes')
        .select(`
          outcome,
          court:courts(name),
          judge:judges(name),
          matter_type,
          created_at
        `)
        .eq('profile_id', profile.id),

      // Task metrics
      supabase
        .from('tasks')
        .select('status, due_date, completed_at')
        .eq('matter_id', matterId),

      // Billing metrics
      supabase
        .from('matter_billing')
        .select('hours_logged_manual, hours_logged_auto, total_billed')
        .eq('matter_id', matterId),

      // Current matter details
      supabase
        .from('matters')
        .select('matter_type, court:courts(name), judge:judges(name)')
        .eq('id', matterId)
        .single()
    ]);

    const outcomes = (outcomesResult.data || []) as MatterOutcome[];
    const tasks = tasksResult.data || [];
    const billing = billingResult.data || [];
    const currentMatter = currentMatterResult.data;

    if (!currentMatter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    // Calculate task metrics
    const taskMetrics: TaskMetrics = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      average_completion_time: calculateAverageCompletionTime(tasks)
    };

    // Calculate billing metrics
    const billingMetrics: BillingMetrics = {
      total_hours: billing.reduce((sum, b) => 
        sum + (b.hours_logged_manual || 0) + (b.hours_logged_auto || 0), 0),
      total_billed: billing.reduce((sum, b) => sum + (b.total_billed || 0), 0),
      average_hourly_rate: calculateAverageHourlyRate(billing)
    };

    // Generate predictive insights
    const insights: PredictiveInsights = {
      outcome_prediction: predictOutcome(outcomes, currentMatter),
      timeline_prediction: predictTimeline(tasks, outcomes, currentMatter),
      resource_prediction: predictResources(billing, outcomes, currentMatter),
      risk_assessment: assessRisks(tasks, billing, currentMatter)
    };

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating predictive insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateAverageCompletionTime(tasks: any[]): number {
  const completedTasks = tasks.filter(t => t.completed_at && t.created_at);
  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const completionTime = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
    return sum + completionTime;
  }, 0);

  return totalTime / completedTasks.length;
}

function calculateAverageHourlyRate(billing: any[]): number {
  const totalHours = billing.reduce((sum, b) => 
    sum + (b.hours_logged_manual || 0) + (b.hours_logged_auto || 0), 0);
  const totalBilled = billing.reduce((sum, b) => sum + (b.total_billed || 0), 0);
  
  return totalHours > 0 ? totalBilled / totalHours : 0;
}

function predictOutcome(outcomes: MatterOutcome[], currentMatter: any) {
  // Find similar matters based on type, court, and judge
  const similarMatters = outcomes.filter(o => 
    o.matter_type === currentMatter.matter_type &&
    o.court?.[0]?.name === currentMatter.court?.[0]?.name
  );

  if (similarMatters.length === 0) {
    return {
      predicted_outcome: 'Unknown',
      confidence_score: 0,
      factors: []
    };
  }

  // Calculate win rate for similar matters
  const wins = similarMatters.filter(o => o.outcome === 'Won').length;
  const winRate = wins / similarMatters.length;

  // Identify key factors
  const factors = [
    {
      factor: 'Historical win rate in similar matters',
      impact: winRate
    },
    {
      factor: 'Court experience',
      impact: calculateCourtExperience(outcomes, currentMatter.court?.[0]?.name)
    },
    {
      factor: 'Judge experience',
      impact: calculateJudgeExperience(outcomes, currentMatter.judge?.[0]?.name)
    }
  ];

  return {
    predicted_outcome: winRate > 0.5 ? 'Won' : 'Lost',
    confidence_score: Math.abs(winRate - 0.5) * 2, // Higher confidence when win rate is further from 50%
    factors
  };
}

function predictTimeline(tasks: any[], outcomes: MatterOutcome[], currentMatter: any) {
  // Calculate average completion time for similar matters
  const similarMatters = outcomes.filter(o => 
    o.matter_type === currentMatter.matter_type
  );

  const averageCompletionTime = similarMatters.reduce((sum, matter) => {
    const startDate = new Date(matter.created_at);
    const endDate = new Date(matter.updated_at);
    return sum + (endDate.getTime() - startDate.getTime());
  }, 0) / similarMatters.length;

  // Calculate current progress
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? completedTasks / tasks.length : 0;

  // Estimate remaining time
  const estimatedRemainingTime = averageCompletionTime * (1 - progress);
  const estimatedCompletionDate = new Date(Date.now() + estimatedRemainingTime);

  return {
    estimated_completion_date: estimatedCompletionDate.toISOString(),
    confidence_score: calculateTimelineConfidence(tasks, similarMatters.length),
    factors: [
      {
        factor: 'Average completion time for similar matters',
        impact: 0.7
      },
      {
        factor: 'Current progress',
        impact: progress
      },
      {
        factor: 'Task complexity',
        impact: calculateTaskComplexity(tasks)
      }
    ]
  };
}

function predictResources(billing: any[], outcomes: MatterOutcome[], currentMatter: any) {
  // Calculate average hours and cost for similar matters
  const similarMatters = outcomes.filter(o => 
    o.matter_type === currentMatter.matter_type
  );

  const averageHours = billing.reduce((sum, b) => 
    sum + (b.hours_logged_manual || 0) + (b.hours_logged_auto || 0), 0) / billing.length;
  
  const averageCost = billing.reduce((sum, b) => 
    sum + (b.total_billed || 0), 0) / billing.length;

  return {
    estimated_hours: averageHours,
    estimated_cost: averageCost,
    confidence_score: calculateResourceConfidence(billing.length, similarMatters.length),
    factors: [
      {
        factor: 'Historical hours for similar matters',
        impact: 0.8
      },
      {
        factor: 'Matter complexity',
        impact: calculateMatterComplexity(currentMatter)
      },
      {
        factor: 'Team experience',
        impact: calculateTeamExperience(outcomes)
      }
    ]
  };
}

function assessRisks(tasks: any[], billing: any[], currentMatter: any) {
  const risks = [];

  // Check for overdue tasks
  const overdueTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    t.due_date && 
    new Date(t.due_date) < new Date()
  );

  if (overdueTasks.length > 0) {
    risks.push({
      risk: 'Overdue tasks',
      severity: Math.min(overdueTasks.length / tasks.length, 1),
      mitigation_strategy: 'Prioritize and reassign overdue tasks'
    });
  }

  // Check billing efficiency
  const billingEfficiency = calculateBillingEfficiency(billing);
  if (billingEfficiency < 0.7) {
    risks.push({
      risk: 'Low billing efficiency',
      severity: 1 - billingEfficiency,
      mitigation_strategy: 'Review billing practices and time tracking'
    });
  }

  // Calculate overall risk score
  const riskScore = risks.reduce((sum, risk) => sum + risk.severity, 0) / risks.length;

  return {
    risk_level: getRiskLevel(riskScore),
    risk_score: riskScore,
    key_risks: risks
  };
}

// Helper functions for calculations
function calculateCourtExperience(outcomes: MatterOutcome[], courtName: string): number {
  const courtMatters = outcomes.filter(o => o.court?.[0]?.name === courtName);
  return Math.min(courtMatters.length / 10, 1); // Normalize to 0-1
}

function calculateJudgeExperience(outcomes: MatterOutcome[], judgeName: string): number {
  const judgeMatters = outcomes.filter(o => o.judge?.[0]?.name === judgeName);
  return Math.min(judgeMatters.length / 5, 1); // Normalize to 0-1
}

function calculateTaskComplexity(tasks: any[]): number {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  if (completedTasks.length === 0) return 0.5;

  const averageCompletionTime = calculateAverageCompletionTime(completedTasks);
  return Math.min(averageCompletionTime / (24 * 60 * 60 * 1000), 1); // Normalize to 0-1
}

function calculateMatterComplexity(matter: any): number {
  // This is a simplified calculation. In a real system, you would consider
  // more factors like matter type, number of parties, etc.
  return 0.5;
}

function calculateTeamExperience(outcomes: MatterOutcome[]): number {
  return Math.min(outcomes.length / 20, 1); // Normalize to 0-1
}

function calculateBillingEfficiency(billing: any[]): number {
  const totalHours = billing.reduce((sum, b) => 
    sum + (b.hours_logged_manual || 0) + (b.hours_logged_auto || 0), 0);
  const totalBilled = billing.reduce((sum, b) => sum + (b.total_billed || 0), 0);
  
  if (totalHours === 0) return 1;
  return totalBilled / (totalHours * 200); // Assuming $200/hour as baseline
}

function calculateTimelineConfidence(tasks: any[], similarMattersCount: number): number {
  const taskConfidence = Math.min(tasks.length / 10, 1);
  const historicalConfidence = Math.min(similarMattersCount / 5, 1);
  return (taskConfidence + historicalConfidence) / 2;
}

function calculateResourceConfidence(billingCount: number, similarMattersCount: number): number {
  const billingConfidence = Math.min(billingCount / 5, 1);
  const historicalConfidence = Math.min(similarMattersCount / 5, 1);
  return (billingConfidence + historicalConfidence) / 2;
}

function getRiskLevel(riskScore: number): string {
  if (riskScore < 0.3) return 'Low';
  if (riskScore < 0.7) return 'Medium';
  return 'High';
} 