import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface UserMetrics {
  profile_completion: number;
  productivity_score: number;
  client_feedback: number;
  time_saved: number;
  ai_interactions: number;
  networking_score: number;
  compliance_score: number;
  billing_efficiency: number;
  workflow_efficiency: number;
  learning_progress: number;
}

export async function calculateProfileCompletion(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return 0;

  const requiredFields = [
    'full_name',
    'email',
    'phone_number',
    'address',
    'firm_name',
    'specialization',
    'bar_number',
    'years_of_practice'
  ];

  const completedFields = requiredFields.filter(field => profile[field]);
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

export async function calculateProductivityScore(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  // Get tasks completed in the last week
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!tasks?.length) return 0;

  const completedTasks = tasks.filter(task => task.status === 'completed');
  return Math.round((completedTasks.length / tasks.length) * 100);
}

export async function calculateClientFeedback(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: feedback } = await supabase
    .from('client_feedback')
    .select('rating')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!feedback?.length) return 0;

  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length;
  return Number(averageRating.toFixed(1));
}

export async function calculateTimeSaved(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: activities } = await supabase
    .from('user_activities')
    .select('time_saved')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!activities?.length) return 0;

  return activities.reduce((acc, curr) => acc + (curr.time_saved || 0), 0);
}

export async function calculateAIIntractions(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: interactions } = await supabase
    .from('ai_interactions')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  return interactions?.length || 0;
}

export async function calculateNetworkingScore(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: connections } = await supabase
    .from('professional_connections')
    .select('*')
    .eq('user_id', userId);

  if (!connections?.length) return 0;

  // Calculate score based on number of connections and their quality
  const score = connections.reduce((acc, curr) => {
    const quality = curr.connection_strength || 1;
    return acc + quality;
  }, 0);

  return Math.min(Math.round((score / (connections.length * 2)) * 100), 100);
}

export async function calculateComplianceScore(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: compliance } = await supabase
    .from('compliance_checks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return compliance?.score || 0;
}

export async function calculateBillingEfficiency(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!invoices?.length) return 0;

  const avgProcessingTime = invoices.reduce((acc, curr) => {
    const processingTime = new Date(curr.paid_at).getTime() - new Date(curr.created_at).getTime();
    return acc + processingTime;
  }, 0) / invoices.length;

  // Convert to days and calculate efficiency score
  const avgDays = avgProcessingTime / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.round(100 - (avgDays * 10)));
}

export async function calculateWorkflowEfficiency(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: workflows } = await supabase
    .from('workflow_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return workflows?.efficiency_score || 0;
}

export async function calculateLearningProgress(userId: string): Promise<number> {
  const supabase = createClientComponentClient();
  
  const { data: learning } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return learning?.progress || 0;
}

export async function updateUserMetrics(userId: string): Promise<void> {
  const supabase = createClientComponentClient();

  const metrics: UserMetrics = {
    profile_completion: await calculateProfileCompletion(userId),
    productivity_score: await calculateProductivityScore(userId),
    client_feedback: await calculateClientFeedback(userId),
    time_saved: await calculateTimeSaved(userId),
    ai_interactions: await calculateAIIntractions(userId),
    networking_score: await calculateNetworkingScore(userId),
    compliance_score: await calculateComplianceScore(userId),
    billing_efficiency: await calculateBillingEfficiency(userId),
    workflow_efficiency: await calculateWorkflowEfficiency(userId),
    learning_progress: await calculateLearningProgress(userId)
  };

  const { error } = await supabase
    .from('user_metrics')
    .upsert({
      user_id: userId,
      ...metrics
    });

  if (error) {
    console.error('Error updating user metrics:', error);
    throw error;
  }
} 