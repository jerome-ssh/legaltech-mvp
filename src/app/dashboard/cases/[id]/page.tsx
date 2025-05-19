"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface Case {
  id: string;
  title: string;
  status: string;
  assigned_to: string;
  client_id: string;
  priority: string;
  description: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    async function fetchCase() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, status, assigned_to, client_id, priority, description")
        .eq("id", caseId)
        .single();
      if (error) setError(error.message);
      else setCaseData(data);
      setLoading(false);
    }
    if (caseId) fetchCase();
  }, [caseId]);

  if (loading) return <div>Loading matter...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!caseData) return <div>Matter not found.</div>;

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-bold mb-2">{caseData.title} (Matter)</h2>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="details">Matter Details</TabsTrigger>
            <TabsTrigger value="team">Matter Team</TabsTrigger>
            <TabsTrigger value="stages">Matter Stages</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div>
              <p><b>Status:</b> {caseData.status}</p>
              <p><b>Assigned To:</b> {caseData.assigned_to}</p>
              <p><b>Client:</b> {caseData.client_id}</p>
              <p><b>Priority:</b> {caseData.priority}</p>
              <p><b>Matter Description:</b> {caseData.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="team">
            <CaseTeam caseId={caseData.id} />
          </TabsContent>
          <TabsContent value="stages">
            <CaseStages caseId={caseData.id} />
          </TabsContent>
          <TabsContent value="activity">
            <CaseActivityLog caseId={caseData.id} />
          </TabsContent>
        </Tabs>
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