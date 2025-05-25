"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface Case {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  client_id: string;
  priority: string;
  description: string;
}

export default function MatterDetailPage({ params }: { params: { id: string } }) {
  const [matterData, setMatterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatterData() {
      try {
      const { data, error } = await supabase
          .from("matters")
          .select(`
            *,
            clients (
              name,
              email,
              phone
            ),
            matter_status (
              status,
              changed_at,
              notes
            ),
            matter_billing (
              billing_type,
              rate,
              currency
            )
          `)
          .eq("id", params.id)
        .single();

        if (error) throw error;
        setMatterData(data);
      } catch (err) {
        console.error("Error fetching matter data:", err);
        setError("Failed to load matter data");
      } finally {
        setLoading(false);
      }
    }

    fetchMatterData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  if (!matterData) {
    return (
      <div className="text-center text-gray-500 py-8">
        Matter not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{matterData.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button>Add Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Matter Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">{matterData.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">{matterData.priority}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1">{matterData.description || "No description provided"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <MatterStages matterId={matterData.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1">{matterData.clients?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1">{matterData.clients?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1">{matterData.clients?.phone}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Billing Type</dt>
                  <dd className="mt-1">{matterData.matter_billing?.billing_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Rate</dt>
                  <dd className="mt-1">
                    {matterData.matter_billing?.rate} {matterData.matter_billing?.currency}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MatterStages({ matterId }: { matterId: string }) {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStages() {
      try {
        const { data, error } = await supabase
          .from("matter_status")
          .select("*")
          .eq("matter_id", matterId)
          .order("changed_at", { ascending: false });

        if (error) throw error;
        setStages(data || []);
      } catch (err) {
        console.error("Error fetching matter stages:", err);
        setError("Failed to load matter stages");
      } finally {
      setLoading(false);
    }
    }

    fetchStages();
  }, [matterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matter Stages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stage.status}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(stage.changed_at).toLocaleDateString()}
                  </span>
                </div>
                {stage.notes && (
                  <p className="text-sm text-gray-500 mt-1">{stage.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Subcomponents for tabs ---
function CaseTeam({ caseId }: { caseId: string }) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchTeam() {
      setLoading(true);
      const { data } = await supabase
        .from("case_team_members")
        .select("id, user_id, created_at, updated_at")
        .eq("case_id", caseId);
      setTeam(data || []);
      setLoading(false);
    }
    fetchTeam();
  }, [caseId]);
  if (loading) return <div>Loading team...</div>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th>User</th>
          <th>Added</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {team.map(member => (
          <tr key={member.id}>
            <td>{member.user_id}</td>
            <td>{new Date(member.created_at).toLocaleString()}</td>
            <td>{new Date(member.updated_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CaseStages({ caseId }: { caseId: string }) {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchStages() {
      setLoading(true);
      const { data } = await supabase
        .from("case_stages")
        .select("id, stage_name, due_date, priority, progress, status, assigned_to")
        .eq("case_id", caseId)
        .order("due_date", { ascending: true });
      setStages(data || []);
      setLoading(false);
    }
    fetchStages();
  }, [caseId]);
  if (loading) return <div>Loading stages...</div>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th>Stage</th>
          <th>Due Date</th>
          <th>Priority</th>
          <th>Progress</th>
          <th>Status</th>
          <th>Assigned To</th>
        </tr>
      </thead>
      <tbody>
        {stages.map(stage => (
          <tr key={stage.id}>
            <td>{stage.stage_name}</td>
            <td>{stage.due_date ? new Date(stage.due_date).toLocaleDateString() : ""}</td>
            <td>{stage.priority}</td>
            <td>{stage.progress}</td>
            <td>{stage.status}</td>
            <td>{stage.assigned_to}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CaseActivityLog({ caseId }: { caseId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("id, user_id, action, target_table, target_id, extra_data, timestamp")
        .eq("target_table", "cases")
        .eq("target_id", caseId)
        .order("timestamp", { ascending: false });
      setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, [caseId]);
  if (loading) return <div>Loading activity log...</div>;
  return (
    <ul className="space-y-2">
      {logs.map(log => (
        <li key={log.id}>
          <b>{log.action}</b> by {log.user_id} at {new Date(log.timestamp).toLocaleString()}<br />
          <span className="text-xs text-gray-500">{JSON.stringify(log.extra_data)}</span>
        </li>
      ))}
    </ul>
  );
} 