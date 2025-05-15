"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ClientFeedback {
  id: string;
  case_id: string;
  feedback_text: string;
  rating: number;
  created_at: string;
}

export default function ClientFeedbackList() {
  const { user, isLoaded } = useUser();
  const [feedback, setFeedback] = useState<ClientFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    const fetchFeedback = async () => {
      try {
        // Assumes RLS restricts to user
        const { data, error } = await supabase
          .from("client_feedback")
          .select("id, case_id, feedback_text, rating, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setFeedback(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [isLoaded, user]);

  const filtered = feedback.filter(f =>
    f.case_id.toLowerCase().includes(search.toLowerCase()) ||
    f.feedback_text.toLowerCase().includes(search.toLowerCase()) ||
    f.rating.toString().includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Client Feedback</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-feedback" className="sr-only">Search Feedback</label>
        <input
          id="search-feedback"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by case, feedback, or rating..."
          aria-label="Search feedback by case, feedback, or rating"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(f => (
          <Card key={f.id} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>Case: {f.case_id}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-gray-500 mb-2">Rating: {f.rating}/5</div>
              <div className="text-sm text-gray-500 mb-2">{f.feedback_text}</div>
              <div className="text-xs text-gray-400 mb-2">Date: {new Date(f.created_at).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-gray-500">No feedback found.</div>}
      </div>
    </div>
  );
} 