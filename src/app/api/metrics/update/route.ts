import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Calculate profile completion
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
      const completedFields = fields.filter(field => {
        const value = profile[field];
        
        // Special handling for phone_number to ensure it's a valid format
        if (field === 'phone_number') {
          return value && value.startsWith('+') && value.length >= 10;
        }
        
        // For boolean fields
        if (field === 'onboarding_completed') {
          return value === true;
        }
        
        // For all other fields, check if they have a non-empty value
        return value !== null && value !== undefined && value !== '';
      });
      
      const groupCompletion = (completedFields.length / fields.length) * weight;
      
      // Always add weight for required groups, or if there are completed fields
      if (required || completedFields.length > 0) {
        totalCompletion += groupCompletion;
        totalWeight += weight;
      }
    });

    // Check for professional IDs and certifications
    const { data: professionalIds } = await supabaseAdmin
      .from('professional_ids')
      .select('certifications')
      .eq('profile_id', profileId);

    if (professionalIds && professionalIds.length > 0) {
      const hasCertifications = professionalIds.some(
        record => record.certifications && record.certifications.length > 0
      );
      
      if (hasCertifications) {
        totalCompletion = Math.min(100, totalCompletion + 10);
      }
    }

    const profileCompletion = totalWeight > 0 ? Math.round((totalCompletion / totalWeight) * 100) : 0;

    // Calculate other metrics
    const [
      { data: documents, error: documentsError },
      { data: connections, error: connectionsError },
      { data: invoices, error: invoicesError },
      { data: aiInteractions, error: aiInteractionsError },
      { data: tasks, error: tasksError },
      { data: feedback, error: feedbackError }
    ] = await Promise.all([
      supabaseAdmin
        .from('documents')
        .select('*')
        .eq('profile_id', profileId),
      supabaseAdmin
        .from('connections')
        .select('*')
        .eq('profile_id', profileId),
      supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('profile_id', profileId),
      supabaseAdmin
        .from('ai_interactions')
        .select('*')
        .eq('profile_id', profileId),
      supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin
        .from('client_feedback')
        .select('rating')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (documentsError) throw documentsError;
    if (connectionsError) throw connectionsError;
    if (invoicesError) throw invoicesError;
    if (aiInteractionsError) throw aiInteractionsError;
    if (tasksError) throw tasksError;
    if (feedbackError) throw feedbackError;

    // Calculate productivity score
    const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
    const productivityScore = tasks?.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // Calculate client feedback score
    const averageRating = feedback?.length ? 
      feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length : 0;
    const clientFeedback = Number(averageRating.toFixed(1));

    // Calculate metrics
    const metrics = {
      profile_id: profileId,
      profile_completion: profileCompletion,
      productivity_score: productivityScore,
      client_feedback: clientFeedback,
      time_saved: 0, // This will be calculated by a separate endpoint
      ai_interactions: aiInteractions?.length || 0,
      networking_score: connections?.length ? Math.min(100, connections.length * 10) : 0,
      compliance_score: documents?.length ? Math.round((documents.filter(doc => doc.status === 'approved').length / documents.length) * 100) : 0,
      billing_efficiency: invoices?.length ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100) : 0,
      workflow_efficiency: 0, // This will be calculated by a separate endpoint
      learning_progress: 0 // Placeholder
    };

    // Check if metrics exist
    const { data: existingMetrics, error: checkError } = await supabaseAdmin
      .from('user_metrics')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;
    if (existingMetrics) {
      // Update existing metrics
      result = await supabaseAdmin
        .from('user_metrics')
        .update(metrics)
        .eq('profile_id', profileId)
        .select()
        .single();
    } else {
      // Insert new metrics
      result = await supabaseAdmin
        .from('user_metrics')
        .insert(metrics)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true, metrics: result.data });
  } catch (error) {
    console.error('Error updating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics' },
      { status: 500 }
    );
  }
} 