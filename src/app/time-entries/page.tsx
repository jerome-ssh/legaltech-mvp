"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import TimeEntryForm from "@/components/time-entries/TimeEntryForm";
import { useToast } from "@/components/ui/use-toast";

interface TimeEntry {
  id: string;
  case_id: string;
  description: string;
  hours: number;
  date: string;
  status: string;
}

export default function TimeEntryListPage() {
  const { user, isLoaded } = useUser();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    const fetchEntries = async () => {
      try {
        // Assumes RLS restricts to user
        const { data, error } = await supabase
          .from("time_entries")
          .select("id, case_id, description, hours, date, status")
          .order("date", { ascending: false });
        if (error) throw error;
        setEntries(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [isLoaded, user]);

  const filtered = entries.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.case_id.toLowerCase().includes(search.toLowerCase()) ||
    e.status.toLowerCase().includes(search.toLowerCase()) ||
    e.date.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Time Entries</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowForm(true)}
          aria-label="Add new time entry"
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-time-entries" className="sr-only">Search Time Entries</label>
        <input
          id="search-time-entries"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by description, case, status, or date..."
          aria-label="Search time entries by description, case, status, or date"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {showForm && <TimeEntryForm onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map(e => (
            <Card key={e.id} className="h-full flex flex-col justify-between">
              <CardHeader className="pb-2"><CardTitle>{e.description}</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="text-sm text-gray-500 mb-2">Case: {e.case_id}</div>
                <div className="text-sm text-gray-500 mb-2">Hours: {e.hours}</div>
                <div className="text-sm text-gray-500 mb-2">Status: {e.status}</div>
                <div className="text-xs text-gray-400 mb-2">Date: {new Date(e.date).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-gray-500">No time entries found.</div>}
        </div>
      )}
    </div>
  );
} 