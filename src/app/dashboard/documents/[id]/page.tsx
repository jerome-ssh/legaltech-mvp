"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface Document {
  id: string;
  title: string;
  status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  file_url: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params?.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, status, uploaded_by, created_at, updated_at, file_url")
        .eq("id", documentId)
        .single();
      if (error) setError(error.message);
      else setDocument(data);
      setLoading(false);
    }
    if (documentId) fetchDocument();
  }, [documentId]);

  if (loading) return <div>Loading document...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!document) return <div>Document not found.</div>;

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-bold mb-2">{document.title}</h2>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div>
              <p><b>Status:</b> {document.status}</p>
              <p><b>Uploaded By:</b> {document.uploaded_by}</p>
              <p><b>Created At:</b> {new Date(document.created_at).toLocaleString()}</p>
              <p><b>Last Updated:</b> {new Date(document.updated_at).toLocaleString()}</p>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download/View File</a>
            </div>
          </TabsContent>
          <TabsContent value="versions">
            <DocumentVersions documentId={document.id} />
          </TabsContent>
          <TabsContent value="permissions">
            <DocumentPermissions documentId={document.id} />
          </TabsContent>
          <TabsContent value="audit">
            <DocumentAuditLog documentId={document.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// --- Subcomponents for tabs ---
function DocumentVersions({ documentId }: { documentId: string }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      const { data } = await supabase
        .from("document_versions")
        .select("id, version_number, file_url, created_at, created_by")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });
      setVersions(data || []);
      setLoading(false);
    }
    fetchVersions();
  }, [documentId]);
  if (loading) return <div>Loading versions...</div>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th>Version</th>
          <th>Created At</th>
          <th>Created By</th>
          <th>File</th>
        </tr>
      </thead>
      <tbody>
        {versions.map(v => (
          <tr key={v.id}>
            <td>{v.version_number}</td>
            <td>{new Date(v.created_at).toLocaleString()}</td>
            <td>{v.created_by}</td>
            <td><a href={v.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocumentPermissions({ documentId }: { documentId: string }) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchPermissions() {
      setLoading(true);
      const { data } = await supabase
        .from("document_permissions")
        .select("id, user_id, permission_level, granted_by, granted_at, updated_at")
        .eq("document_id", documentId);
      setPermissions(data || []);
      setLoading(false);
    }
    fetchPermissions();
  }, [documentId]);
  if (loading) return <div>Loading permissions...</div>;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th>User</th>
          <th>Permission</th>
          <th>Granted By</th>
          <th>Granted At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        {permissions.map(p => (
          <tr key={p.id}>
            <td>{p.user_id}</td>
            <td>{p.permission_level}</td>
            <td>{p.granted_by}</td>
            <td>{new Date(p.granted_at).toLocaleString()}</td>
            <td>{new Date(p.updated_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocumentAuditLog({ documentId }: { documentId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data } = await supabase
        .from("document_audit_logs")
        .select("id, action, user_id, details, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, [documentId]);
  if (loading) return <div>Loading audit log...</div>;
  return (
    <ul className="space-y-2">
      {logs.map(log => (
        <li key={log.id}>
          <b>{log.action}</b> by {log.user_id} at {new Date(log.created_at).toLocaleString()}<br />
          <span className="text-xs text-gray-500">{JSON.stringify(log.details)}</span>
        </li>
      ))}
    </ul>
  );
} 