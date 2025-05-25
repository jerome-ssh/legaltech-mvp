"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MatterBillingRecord {
  id: string;
  invoice_number: string;
  case_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function BillingDashboard() {
  const { user, isLoaded } = useUser();
  const [records, setRecords] = useState<MatterBillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    const fetchBilling = async () => {
      try {
        // Assumes RLS restricts to user
        const { data, error } = await supabase
          .from("matter_billing")
          .select("id, invoice_number, case_id, amount, status, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setRecords(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [isLoaded, user]);

  const filtered = records.filter(r =>
    r.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    r.case_id.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase()) ||
    r.amount.toString().includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Billing Dashboard</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-billing" className="sr-only">Search Billing</label>
        <input
          id="search-billing"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by invoice, case, status, or amount..."
          aria-label="Search billing by invoice, case, status, or amount"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(r => (
          <Card key={r.id} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>Invoice #{r.invoice_number}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-gray-500 mb-2">Case: {r.case_id}</div>
              <div className="text-sm text-gray-500 mb-2">Amount: ${r.amount.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mb-2">Status: {r.status}</div>
              <div className="text-xs text-gray-400 mb-2">Date: {new Date(r.created_at).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-gray-500">No billing records found.</div>}
      </div>
    </div>
  );
} 