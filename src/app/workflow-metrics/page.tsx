"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UserMetrics {
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

const metricLabels: Record<string, string> = {
  profile_completion: "Profile Completion",
  productivity_score: "Productivity Score",
  client_feedback: "Client Feedback",
  time_saved: "Time Saved",
  ai_interactions: "AI Interactions",
  networking_score: "Networking Score",
  compliance_score: "Compliance Score",
  billing_efficiency: "Billing Efficiency",
  workflow_efficiency: "Workflow Efficiency",
  learning_progress: "Learning Progress",
};

export default function WorkflowMetricsDashboard() {
  const { user, isLoaded } = useUser();
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    const fetchMetrics = async () => {
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
        const { data, error } = await supabase
          .from("user_metrics")
          .select("*")
          .eq("profile_id", profile.id)
          .single();
        if (error) throw error;
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [isLoaded, user]);

  let metricEntries: { key: string; label: string; value: string }[] = [];
  if (metrics) {
    metricEntries = Object.entries(metrics).map(([key, value]) => ({
      key,
      label: metricLabels[key] || key,
      value: typeof value === "number" ? value.toString() : value,
    }));
    if (search) {
      metricEntries = metricEntries.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.value.toLowerCase().includes(search.toLowerCase())
      );
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!metrics) return <div className="text-gray-500">No metrics found.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Workflow Metrics</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-metrics" className="sr-only">Search Metrics</label>
        <input
          id="search-metrics"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by metric name or value..."
          aria-label="Search workflow metrics by name or value"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {metricEntries.map(m => (
          <Card key={m.key} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>{m.label}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">{m.value}</CardContent>
          </Card>
        ))}
        {metricEntries.length === 0 && <div className="col-span-full text-gray-500">No metrics found.</div>}
      </div>
    </div>
  );
} 