"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  status: string;
  updated_at: string;
}

export default function DocumentListPage() {
  const { user, isLoaded } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setLoading(true);
    setError(null);
    // Fetch documents user has access to (by permission, team, or ownership)
    const fetchDocuments = async () => {
      try {
        // This query assumes RLS is set up so user only sees their docs
        const { data, error } = await supabase
          .from("documents")
          .select("id, name, type, status, updated_at")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [isLoaded, user]);

  const filtered = documents.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <label htmlFor="search-docs" className="sr-only">Search Documents</label>
        <input
          id="search-docs"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or type..."
          aria-label="Search documents by name or type"
          className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(doc => (
          <Card key={doc.id} className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2"><CardTitle>{doc.name}</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-sm text-gray-500 mb-2">Type: {doc.type}</div>
              <div className="text-sm text-gray-500 mb-2">Status: {doc.status}</div>
              <div className="text-xs text-gray-400 mb-2">Last updated: {new Date(doc.updated_at).toLocaleString()}</div>
              <Link href={`/documents/${doc.id}`} className="text-blue-600 hover:underline text-sm mt-auto" aria-label={`View details for document ${doc.name}`}>View Details</Link>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-gray-500">No documents found.</div>}
      </div>
    </div>
  );
} 