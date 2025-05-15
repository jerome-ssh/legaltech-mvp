"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Case {
  id: string;
  name: string;
  status: string;
  type: string;
  updated_at: string;
}

export default function CaseListPage() {
  const { user, isLoaded } = useUser();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    // Fetch cases user is a participant in (by team, role, or ownership)
    const fetchCases = async () => {
      try {
        // Join case_participants to filter by user
        const { data, error } = await supabase
          .from("cases")
          .select("id, name, status, type, updated_at, case_participants!inner(user_id)")
          .eq("case_participants.user_id", user.id)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        setCases(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [isLoaded, user]);

  const filtered = cases.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase()) ||
    c.status.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Cases</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-cases" className="sr-only">Search Cases</label>
        <input
          id="search-cases"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, type, or status..."
          aria-label="Search cases by name, type, or status"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(c => (
          <Card key={c.id} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>{c.name}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-gray-500 mb-2">Type: {c.type}</div>
              <div className="text-sm text-gray-500 mb-2">Status: {c.status}</div>
              <div className="text-xs text-gray-400 mb-2">Last updated: {new Date(c.updated_at).toLocaleString()}</div>
              <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline text-sm mt-auto" aria-label={`View details for case ${c.name}`}>View Details</Link>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-gray-500">No cases found.</div>}
      </div>
    </div>
  );
} 