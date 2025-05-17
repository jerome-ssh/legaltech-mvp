import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { UserMetrics } from "@/lib/types/user-metrics";

export function useUserMetrics() {
  const { user, isLoaded } = useUser();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchMetrics = useCallback(async () => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptFetch = async (): Promise<UserMetrics | null> => {
      try {
        // First get the profile ID from the clerk_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single();
        
        if (profileError || !profile) {
          throw new Error('Profile not found');
        }

        // Then get the metrics using the profile ID
        const { data, error: metricsError } = await supabase
          .from("user_metrics")
          .select("*")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (metricsError && metricsError.code !== 'PGRST116') {
          throw metricsError;
        }

        if (data) {
          return data;
        }

        // If no metrics found, initialize with default values
        const defaultMetrics = {
          profile_id: profile.id,
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

        const { data: newMetrics, error: initError } = await supabase
          .from("user_metrics")
          .insert(defaultMetrics)
          .select()
          .single();

        if (initError) {
          throw initError;
        }

        return newMetrics;
      } catch (err: any) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retry attempt ${retryCount} of ${maxRetries}`);
          // Wait for a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptFetch();
        }
        throw err;
      }
    };

    try {
      const metrics = await attemptFetch();
      setMetrics(metrics);
    } catch (err: any) {
      console.error('Error in fetchMetrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, supabase]);

  const updateMetrics = useCallback(async (newMetrics: Partial<UserMetrics>) => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    try {
      // First get the profile ID from the clerk_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      // Then update the metrics using the profile ID
      const { data, error: metricsError } = await supabase
        .from("user_metrics")
        .upsert({
          profile_id: profile.id,
          ...newMetrics,
        })
        .select()
        .single();

      if (metricsError) throw metricsError;
      setMetrics(data);
    } catch (err: any) {
      console.error('Error in updateMetrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, supabase]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    update: updateMetrics,
  };
} 