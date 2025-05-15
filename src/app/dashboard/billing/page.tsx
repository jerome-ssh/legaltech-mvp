"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Billing {
  id: string;
  client_id: string;
  case_id: string;
  outstanding: number;
  paid: number;
  created_at: string;
}

export default function BillingDashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [billing, setBilling] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    async function fetchBilling() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("billing")
        .select("id, client_id, case_id, outstanding, paid, created_at")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setBilling(data || []);
      setLoading(false);
    }
    fetchBilling();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) return <div>Loading billing records...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Billing Dashboard</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Client</th>
              <th className="text-left">Case</th>
              <th className="text-left">Outstanding</th>
              <th className="text-left">Paid</th>
              <th className="text-left">Created At</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {billing.map(b => (
              <tr key={b.id} className="border-b">
                <td>{b.client_id}</td>
                <td>{b.case_id}</td>
                <td>{b.outstanding}</td>
                <td>{b.paid}</td>
                <td>{new Date(b.created_at).toLocaleString()}</td>
                <td className="space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/billing/${b.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/billing/${b.id}/add-time-entry`}>Add Time Entry</Link>
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