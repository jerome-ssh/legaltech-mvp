"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Document {
  id: string;
  title: string;
  status: string;
  uploaded_by: string;
  updated_at: string;
}

export default function DocumentListPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    async function fetchDocuments() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, status, uploaded_by, updated_at")
        .order("updated_at", { ascending: false });
      if (error) setError(error.message);
      else setDocuments(data || []);
      setLoading(false);
    }
    fetchDocuments();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) return <div>Loading documents...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Documents</h2>
          <Button asChild>
            <Link href="/dashboard/documents/upload">Upload Document</Link>
          </Button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Title</th>
              <th className="text-left">Status</th>
              <th className="text-left">Uploaded By</th>
              <th className="text-left">Last Updated</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id} className="border-b">
                <td>{doc.title}</td>
                <td>{doc.status}</td>
                <td>{doc.uploaded_by}</td>
                <td>{new Date(doc.updated_at).toLocaleString()}</td>
                <td className="space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/documents/${doc.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/documents/${doc.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/documents/${doc.id}/permissions`}>Permissions</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/documents/${doc.id}/versions`}>Versions</Link>
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