"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Case {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  client_id: string;
  priority: string;
}

export default function CaseListPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    async function fetchCases() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, status, assigned_to, client_id, priority")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setCases(data || []);
      setLoading(false);
    }
    fetchCases();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) return <div>Loading cases...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cases</h2>
          <Button asChild>
            <Link href="/dashboard/cases/create">New Case</Link>
          </Button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Title</th>
              <th className="text-left">Status</th>
              <th className="text-left">Assigned To</th>
              <th className="text-left">Client</th>
              <th className="text-left">Priority</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.id} className="border-b">
                <td>{c.title}</td>
                <td>{c.status}</td>
                <td>{c.assigned_to}</td>
                <td>{c.client_id}</td>
                <td>{c.priority}</td>
                <td className="space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/cases/${c.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/cases/${c.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/cases/${c.id}/team`}>Team</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/cases/${c.id}/stages`}>Stages</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
} 