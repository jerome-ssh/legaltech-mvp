import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Create a service role client only on the server side
const getSupabaseAdmin = () => {
  if (typeof window === 'undefined') {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return null;
};

// Helper function to get profile data
async function getProfileData(clerkId: string) {
  const response = await fetch('/api/profile/check', {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Profile check failed with status: ${response.status}`);
  }

  const responseData = await response.json();
  if (!responseData.success || !responseData.exists || !responseData.profile) {
    throw new Error('Profile not found. Please complete the onboarding process first.');
  }

  return responseData.profile;
}

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

type MetricCalculation = {
  name: keyof UserMetrics;
  fn: (clerkId: string) => Promise<number>;
};

const PROFILE_FIELDS = [
  'id',
  'clerk_id',
  'email',
  'firm_name',
  'created_at',
  'updated_at'
] as const;

export async function getUserUuid(clerkId: string): Promise<string> {
  console.log('Looking up profile for clerk_id:', clerkId);
  
  try {
    // Use the profile check API endpoint to get the profile
    console.log('Fetching profile data from API...');
    const response = await fetch('/api/profile/check', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Profile check failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Profile check API response:', responseData);
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Profile check returned unsuccessful');
    }

    if (!responseData.exists) {
      throw new Error('Profile not found. Please complete the onboarding process first.');
    }

    // Use the profile data returned from the API
    const profile = responseData.profile;
    if (!profile) {
      throw new Error('Profile data not returned from API');
    }

    console.log('Found existing profile:', profile);
  return profile.id;
  } catch (error) {
    console.error('Error in getUserUuid:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
}

export async function calculateProfileCompletion(clerkId: string): Promise<number> {
  console.log('Calculating profile completion for user:', clerkId);
  
  try {
    // Get profile data from API instead of Supabase
    console.log('Fetching profile data from API...');
    const response = await fetch('/api/profile/check', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Profile check failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Profile check API response:', responseData);
    
    if (!responseData.success || !responseData.exists || !responseData.profile) {
      console.error('Profile not found or invalid response');
      return 0;
    }

    const profile = responseData.profile;
    console.log('Profile data for completion calculation:', profile);

    // Define field groups and their weights based on actual data structure
    const fieldGroups = {
      basicInfo: {
        fields: ['first_name', 'last_name', 'email', 'phone_number'],
        weight: 25,
        required: true
      },
      professionalInfo: {
        fields: ['firm_name', 'specialization', 'years_of_practice'],
        weight: 25,
        required: true
      },
      addressInfo: {
        fields: ['address'],
        weight: 15,
        required: true
      },
      extraInfo: {
        fields: ['avatar_url', 'gender'],
        weight: 10,
        required: false
      },
      roleInfo: {
        fields: ['role_id'],
        weight: 15,
        required: true
      },
      onboardingStatus: {
        fields: ['onboarding_completed'],
        weight: 10,
        required: true
      }
    };
    
    let totalCompletion = 0;
    let totalWeight = 0;
    
    // Calculate completion for each field group
    Object.entries(fieldGroups).forEach(([groupName, { fields, weight, required }]) => {
      console.log(`\nProcessing group: ${groupName}`);
      console.log('Fields:', fields);
      console.log('Weight:', weight);
      console.log('Required:', required);
      
      const completedFields = fields.filter(field => {
        const value = profile[field];
        console.log(`Field ${field}:`, value);
        
        // Special handling for phone_number to ensure it's a valid format
        if (field === 'phone_number') {
          const isValid = value && value.startsWith('+') && value.length >= 10;
          console.log(`Phone number validation: ${isValid}`);
          return isValid;
        }
        
        // For boolean fields
        if (field === 'onboarding_completed') {
          const isValid = value === true;
          console.log(`Onboarding completed validation: ${isValid}`);
          return isValid;
        }
        
        // For all other fields, check if they have a non-empty value
        const isValid = value !== null && value !== undefined && value !== '';
        console.log(`Field validation: ${isValid}`);
        return isValid;
      });

      const groupCompletion = (completedFields.length / fields.length) * weight;
      console.log(`Group completion: ${completedFields.length}/${fields.length} fields = ${groupCompletion} points`);
      
      // Always add weight for required groups, or if there are completed fields
      if (required || completedFields.length > 0) {
        totalCompletion += groupCompletion;
        totalWeight += weight;
        console.log(`Added to total: ${groupCompletion} points (total now: ${totalCompletion}, weight: ${totalWeight})`);
      } else {
        console.log('Group not included in total');
      }
    });
    
    // Check if there are professional IDs for extra points
    console.log('\nChecking professional IDs...');
    const supabase = createClientComponentClient();
    const { data: professionalIds, error: pIdError } = await supabase
      .from('professional_ids')
      .select('id, certifications')
      .eq('profile_id', profile.id);
      
    if (!pIdError && professionalIds?.length > 0) {
      console.log('Found professional IDs:', professionalIds);
      // If there's at least one professional ID with certifications, add 10 bonus points up to 100
      const hasCertifications = professionalIds.some(
        record => record.certifications && record.certifications.length > 0
      );
      
      if (hasCertifications) {
        totalCompletion = Math.min(100, totalCompletion + 10); 
        console.log(`Added 10 bonus points for certifications. New total: ${totalCompletion}`);
      } else {
        console.log('No certifications found');
      }
    } else {
      console.log('No professional IDs found or error:', pIdError);
    }
    
    // Calculate final score based on total weight
    const finalScore = totalWeight > 0 ? Math.round((totalCompletion / totalWeight) * 100) : 0;
    console.log('\nFinal calculation:');
    console.log(`Total completion: ${totalCompletion}`);
    console.log(`Total weight: ${totalWeight}`);
    console.log(`Final score: ${finalScore}`);
    
    return finalScore;
  } catch (error) {
    console.error('Error in calculateProfileCompletion:', error);
    return 0;
  }
}

export async function calculateProductivityScore(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Productivity Score ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/productivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch productivity score:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateProductivityScore:', error);
    return 0;
  }
}

export async function calculateClientFeedback(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Client Feedback ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/client-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch client feedback:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateClientFeedback:', error);
    return 0;
  }
}

export async function calculateTimeSaved(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Time Saved ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/time-saved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch time saved:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.timeSaved || 0;
  } catch (error) {
    console.error('Error in calculateTimeSaved:', error);
    return 0;
  }
}

export async function calculateAIIntractions(clerkId: string): Promise<number> {
  console.log('\n=== Calculating AI Interactions ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/ai-interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch AI interactions:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error in calculateAIIntractions:', error);
    return 0;
  }
}

export async function calculateNetworkingScore(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Networking Score ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/networking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch networking score:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateNetworkingScore:', error);
    return 0;
  }
}

export async function calculateComplianceScore(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Compliance Score ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/compliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch compliance score:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateComplianceScore:', error);
    return 0;
  }
}

export async function calculateBillingEfficiency(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Billing Efficiency ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/billing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch billing efficiency:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateBillingEfficiency:', error);
    return 0;
  }
}

export async function calculateWorkflowEfficiency(clerkId: string): Promise<number> {
  console.log('\n=== Calculating Workflow Efficiency ===');
  try {
    const profile = await getProfileData(clerkId);
    console.log('Using profile ID:', profile.id);

    const response = await fetch('/api/metrics/workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: profile.id }),
    });

    if (!response.ok) {
      console.error('Failed to fetch workflow efficiency:', await response.text());
      return 0;
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in calculateWorkflowEfficiency:', error);
    return 0;
  }
}

export async function calculateLearningProgress(clerkId: string): Promise<number> {
  try {
    const supabase = createClientComponentClient();
    const profileId = await getUserUuid(clerkId);
  
    // Since learning_progress table might not exist yet, return 0
    return 0;
  } catch (error) {
    console.error('Error calculating learning progress:', error);
    return 0;
  }
}

export async function fetchUserMetrics(profileId: string) {
  try {
    console.log('Fetching metrics for profile:', profileId);
    
    // Use the API route instead of direct Supabase query
    const response = await fetch(`/api/metrics?profile_id=${profileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from metrics API:', errorData);
      // Return null instead of throwing to prevent UI errors
      return null;
    }

    const data = await response.json();
    console.log('Fetched metrics:', data);

    // If no metrics found, return null
    if (!data) {
      console.log('No metrics found for profile');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    // Return null instead of throwing to prevent UI errors
    return null;
  }
}

export async function updateUserMetrics(profileId: string) {
  try {
    console.log('Starting metrics update process for profile:', profileId);

    // Calculate all metrics
    const [
      profileCompletion,
      productivityScore,
      clientFeedback,
      timeSaved,
      aiInteractions,
      networkingScore,
      complianceScore,
      billingEfficiency,
      workflowEfficiency,
      learningProgress
    ] = await Promise.all([
      calculateProfileCompletion(profileId),
      calculateProductivityScore(profileId),
      calculateClientFeedback(profileId),
      calculateTimeSaved(profileId),
      calculateAIIntractions(profileId),
      calculateNetworkingScore(profileId),
      calculateComplianceScore(profileId),
      calculateBillingEfficiency(profileId),
      calculateWorkflowEfficiency(profileId),
      calculateLearningProgress(profileId)
    ]);

    // Prepare metrics data
    const metricsData = {
      profile_completion: profileCompletion,
      productivity_score: productivityScore,
      client_feedback: clientFeedback,
      time_saved: timeSaved,
      ai_interactions: aiInteractions,
      networking_score: networkingScore,
      compliance_score: complianceScore,
      billing_efficiency: billingEfficiency,
      workflow_efficiency: workflowEfficiency,
      learning_progress: learningProgress
    };

    console.log('Calculated metrics:', metricsData);

    // Send to API
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: profileId,
        ...metricsData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from metrics API:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Metrics updated successfully:', data);

    // Return the updated metrics directly from the response
    return data;
  } catch (error) {
    console.error('Error updating metrics:', error);
    throw error;
  }
} 