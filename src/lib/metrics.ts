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

const PROFILE_FIELDS = [
  'id',
  'clerk_id',
  'email',
  'firm_name',
  'created_at',
  'updated_at'
] as const;

// Helper to get user ID from Clerk ID
async function getUserUuid(clerkId: string) {
  const supabase = createClientComponentClient();
  
  try {
    console.log('Looking up profile for clerk_id:', clerkId);
    
    // First try to get the profile using clerk_id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();
      
    if (error) {
      console.error('Error fetching profile by clerk_id:', error);
      
      // If not found by clerk_id, try using the clerk_id as the id
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', clerkId)
        .single();
        
      if (fallbackError) {
        console.error('Error fetching fallback profile:', fallbackError);
        
        // If both lookups fail, try one more time with a broader query
        const { data: broadProfile, error: broadError } = await supabase
          .from('profiles')
          .select('id')
          .or(`clerk_id.eq.${clerkId},id.eq.${clerkId}`)
          .limit(1);
          
        if (broadError || !broadProfile || broadProfile.length === 0) {
          console.error('All profile lookup attempts failed:', broadError);
          throw new Error('Profile not found after multiple attempts');
        }
        
        console.log('Found profile using broad lookup:', broadProfile[0]);
        return broadProfile[0].id;
      }
      
      if (!fallbackProfile) {
        console.error('No fallback profile found for id:', clerkId);
        throw new Error('Profile not found');
      }
      
      console.log('Found profile using fallback lookup:', fallbackProfile);
      return fallbackProfile.id;
    }
    
    if (!profile) {
      console.error('No profile found for clerk_id:', clerkId);
      throw new Error('Profile not found');
    }
    
    console.log('Found profile:', profile);
    return profile.id;
  } catch (error) {
    console.error('Error in getUserUuid:', error);
    throw error;
  }
}

export async function calculateProfileCompletion(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  console.log('Calculating profile completion for user:', userId);
  
  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for completion calculation:', profileError);
    return 0;
  }
  
  console.log('Profile data for completion calculation:', profile);

  // Define field groups and their weights
  const fieldGroups = {
    basicInfo: {
      fields: ['first_name', 'last_name', 'email', 'phone_number'],
      weight: 30
    },
    professionalInfo: {
      fields: ['firm_name', 'specialization', 'years_of_practice', 'role_id'],
      weight: 40
    },
    addressInfo: {
      fields: ['address', 'home_address'],
      weight: 15
    },
    extraInfo: {
      fields: ['gender', 'avatar_url'],
      weight: 15
    }
  };
  
  let totalCompletion = 0;
  
  // Calculate completion for each field group
  Object.entries(fieldGroups).forEach(([groupName, { fields, weight }]) => {
    const completedFields = fields.filter(field => profile[field] !== null && profile[field] !== undefined && profile[field] !== '');
    const groupCompletion = completedFields.length / fields.length * weight;
    
    console.log(`Group ${groupName}: ${completedFields.length}/${fields.length} fields completed (${groupCompletion}/${weight} points)`);
    
    totalCompletion += groupCompletion;
  });
  
  // Check if there are professional IDs for extra points
  const { data: professionalIds, error: pIdError } = await supabase
    .from('professional_ids')
    .select('id, certifications')
    .eq('profile_id', userId);
    
  if (!pIdError && professionalIds?.length > 0) {
    // If there's at least one professional ID, add 10 bonus points up to 100
    const hasCertifications = professionalIds.some(
      record => record.certifications && record.certifications.length > 0
    );
    
    if (hasCertifications) {
      totalCompletion = Math.min(100, totalCompletion + 10); 
      console.log(`Added 10 bonus points for professional IDs: ${totalCompletion}`);
    }
  }
  
  return Math.round(totalCompletion);
}

export async function calculateProductivityScore(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const profileId = await getUserUuid(clerkId);
  
  // Get tasks completed in the last week
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('profile_id', profileId)
    .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!tasks?.length) return 0;

  const completedTasks = tasks.filter(task => task.status === 'completed');
  return Math.round((completedTasks.length / tasks.length) * 100);
}

export async function calculateClientFeedback(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const profileId = await getUserUuid(clerkId);
  
  const { data: feedback } = await supabase
    .from('client_feedback')
    .select('rating')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!feedback?.length) return 0;

  const averageRating = feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length;
  return Number(averageRating.toFixed(1));
}

export async function calculateTimeSaved(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const profileId = await getUserUuid(clerkId);
  
  const { data: activities } = await supabase
    .from('user_activities')
    .select('time_saved')
    .eq('profile_id', profileId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!activities?.length) return 0;

  return activities.reduce((acc, curr) => acc + (curr.time_saved || 0), 0);
}

export async function calculateAIIntractions(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  // Since ai_interactions table might not exist yet, return 0
  return 0;
}

export async function calculateNetworkingScore(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  // Since professional_connections table might not exist yet, return 0
  return 0;
}

export async function calculateComplianceScore(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  // Since compliance_checks table might not exist yet, return 0
  return 0;
}

export async function calculateBillingEfficiency(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  // Since invoices table might not exist yet, return 0
  return 0;
}

export async function calculateWorkflowEfficiency(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  try {
    console.log('Calculating workflow efficiency for user:', userId);
    
    // Check if user has profile with enough fields filled
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (!profile) return 0;
    
    // Start with 30% baseline for having an account
    let efficiency = 30;
    
    // Add up to 40% for profile completeness
    const profileCompletionScore = await calculateProfileCompletion(clerkId);
    const profileBonus = Math.round((profileCompletionScore / 100) * 40);
    efficiency += profileBonus;
    console.log(`Added ${profileBonus}% from profile completion`);
    
    // Add 15% for having professional IDs/certifications
    const { data: professionalIds } = await supabase
      .from('professional_ids')
      .select('certifications')
      .eq('profile_id', userId);
      
    if (professionalIds && professionalIds.length > 0) {
      const hasCertifications = professionalIds.some(
        record => record.certifications && record.certifications.length > 0
      );
      
      if (hasCertifications) {
        efficiency += 15;
        console.log('Added 15% for having certifications');
      }
    }
    
    // Add 15% if avatar is present (better user recognition)
    if (profile.avatar_url) {
      efficiency += 15;
      console.log('Added 15% for having an avatar');
    }
    
    return Math.min(100, efficiency);
  } catch (error) {
    console.error('Error calculating workflow efficiency:', error);
    return 0;
  }
}

export async function calculateLearningProgress(clerkId: string): Promise<number> {
  const supabase = createClientComponentClient();
  const userId = await getUserUuid(clerkId);
  
  // Since learning_progress table might not exist yet, return 0
  return 0;
}

export async function updateUserMetrics(clerkId: string): Promise<void> {
  const supabase = createClientComponentClient();
  
  try {
    console.log('Starting updateUserMetrics for clerk_id:', clerkId);
    
    // Get the profile ID
    const profileId = await getUserUuid(clerkId);
    console.log('Got profile ID:', profileId);
    
    // Initialize metrics with default values
    const metrics: UserMetrics = {
      profile_completion: 0,
      productivity_score: 0,
      client_feedback: 0,
      time_saved: 0,
      ai_interactions: 0,
      networking_score: 0,
      compliance_score: 0,
      billing_efficiency: 0,
      workflow_efficiency: 0,
      learning_progress: 0
    };

    // Try to calculate each metric, but don't fail if calculation fails
    try {
      console.log('Calculating profile completion...');
      metrics.profile_completion = await calculateProfileCompletion(clerkId);
    } catch (error) {
      console.error('Error calculating profile completion:', error);
    }

    try {
      console.log('Calculating productivity score...');
      metrics.productivity_score = await calculateProductivityScore(clerkId);
    } catch (error) {
      console.error('Error calculating productivity score:', error);
    }

    try {
      console.log('Calculating client feedback...');
      metrics.client_feedback = await calculateClientFeedback(clerkId);
    } catch (error) {
      console.error('Error calculating client feedback:', error);
    }

    try {
      console.log('Calculating time saved...');
      metrics.time_saved = await calculateTimeSaved(clerkId);
    } catch (error) {
      console.error('Error calculating time saved:', error);
    }

    try {
      console.log('Calculating AI interactions...');
      metrics.ai_interactions = await calculateAIIntractions(clerkId);
    } catch (error) {
      console.error('Error calculating AI interactions:', error);
    }

    try {
      console.log('Calculating networking score...');
      metrics.networking_score = await calculateNetworkingScore(clerkId);
    } catch (error) {
      console.error('Error calculating networking score:', error);
    }

    try {
      console.log('Calculating compliance score...');
      metrics.compliance_score = await calculateComplianceScore(clerkId);
    } catch (error) {
      console.error('Error calculating compliance score:', error);
    }

    try {
      console.log('Calculating billing efficiency...');
      metrics.billing_efficiency = await calculateBillingEfficiency(clerkId);
    } catch (error) {
      console.error('Error calculating billing efficiency:', error);
    }

    try {
      console.log('Calculating workflow efficiency...');
      metrics.workflow_efficiency = await calculateWorkflowEfficiency(clerkId);
    } catch (error) {
      console.error('Error calculating workflow efficiency:', error);
    }

    try {
      console.log('Calculating learning progress...');
      metrics.learning_progress = await calculateLearningProgress(clerkId);
    } catch (error) {
      console.error('Error calculating learning progress:', error);
    }

    // Update metrics in database
    console.log('Updating metrics in database...');
    const { error: updateError } = await supabase
      .from('user_metrics')
      .upsert({
        profile_id: profileId,
        ...metrics
      });

    if (updateError) {
      console.error('Error updating user metrics:', updateError);
      throw updateError;
    }
    
    console.log('Successfully updated metrics');
  } catch (error) {
    console.error('Error in updateUserMetrics:', error);
    throw error;
  }
} 