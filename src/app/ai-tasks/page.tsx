"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AITask {
  id: string;
  type: string;
  status: string;
  result: string;
  created_at: string;
}

export default function AITaskList() {
  const { user, isLoaded } = useUser();
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    const fetchTasks = async () => {
      try {
        // Assumes RLS restricts to user
        const { data, error } = await supabase
          .from("ai_tasks")
          .select("id, type, status, result, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setTasks(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [isLoaded, user]);

  const filtered = tasks.filter(t =>
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase()) ||
    t.result.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AI Tasks</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-ai-tasks" className="sr-only">Search AI Tasks</label>
        <input
          id="search-ai-tasks"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by type, status, or result..."
          aria-label="Search AI tasks by type, status, or result"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(t => (
          <Card key={t.id} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>{t.type}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-gray-500 mb-2">Status: {t.status}</div>
              <div className="text-sm text-gray-500 mb-2">Result: {t.result}</div>
              <div className="text-xs text-gray-400 mb-2">Date: {new Date(t.created_at).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-gray-500">No AI tasks found.</div>}
      </div>
    </div>
  );
} 