"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

// NOTE: 'case' = 'matter' in UI/UX/backend

interface Case {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  client_id: string;
  priority: string;
}

export default function MattersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    async function fetchMatters() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("matters")
          .select(`
            *,
            clients (
              name
            ),
            matter_status (
              status,
              changed_at
            )
          `)
        .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setMatters(data || []);
      } catch (err) {
        console.error("Error fetching matters:", err);
        setError("Failed to load matters");
      } finally {
      setLoading(false);
    }
    }
    fetchMatters();
  }, [isLoaded, isSignedIn, statusFilter]);

  const filteredMatters = matters.filter((matter) =>
    matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matter.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded || loading) return <div>Loading matters...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Matters</h1>
        <Link href="/dashboard/matters/new">
          <Button>New Matter</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search matters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredMatters.map((matter) => (
          <Link key={matter.id} href={`/dashboard/matters/${matter.id}`}>
            <Card className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{matter.title}</h3>
                    <p className="text-sm text-gray-500">
                      Client: {matter.clients?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${matter.status === "active" ? "bg-green-100 text-green-800" :
                        matter.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"}`}>
                      {matter.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(matter.created_at).toLocaleDateString()}
                    </p>
                  </div>
        </div>
      </CardContent>
    </Card>
          </Link>
        ))}

        {filteredMatters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No matters found
          </div>
        )}
      </div>
    </div>
  );
} 