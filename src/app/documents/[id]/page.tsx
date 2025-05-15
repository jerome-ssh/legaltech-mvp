"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import DocumentVersionList from "@/components/documents/DocumentVersionList";
import DocumentPermissions from "@/components/documents/DocumentPermissions";
import DocumentAuditLog from "@/components/documents/DocumentAuditLog";
import DocumentComments from "@/components/documents/DocumentComments";

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params?.id as string;
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();
        if (error) throw error;
        setDocument(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!document) return <div className="text-gray-500">Document not found.</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{document.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-gray-500">Type: {document.type}</div>
          <div className="mb-2 text-sm text-gray-500">Status: {document.status}</div>
          <div className="mb-2 text-xs text-gray-400">Last updated: {new Date(document.updated_at).toLocaleString()}</div>
        </CardContent>
      </Card>
      <DocumentVersionList documentId={documentId} />
      <DocumentPermissions documentId={documentId} />
      <DocumentAuditLog documentId={documentId} />
      <DocumentComments documentId={documentId} />
    </div>
  );
} 