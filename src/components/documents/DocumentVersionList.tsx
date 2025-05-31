import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DocumentVersionListProps {
  documentId: string;
}

export default function DocumentVersionList({ documentId }: DocumentVersionListProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    const fetchVersions = async () => {
      try {
        const { data, error } = await supabase
          .from("document_versions")
          .select("id, version_number, created_at, created_by, file_url")
          .eq("document_id", documentId)
          .order("version_number", { ascending: false });
        if (error) throw error;
        setVersions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [documentId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (versions.length === 0) return <div className="text-gray-500">No versions found.</div>;

  return (
    <Card className="mt-4 border-4 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-blue-400">
      <CardHeader>
        <CardTitle>Document Versions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {versions.map(v => (
            <li key={v.id} className="flex items-center justify-between border-b py-2">
              <div>
                <span className="font-semibold">Version {v.version_number}</span>
                <span className="ml-2 text-xs text-gray-500">{new Date(v.created_at).toLocaleString()}</span>
                <span className="ml-2 text-xs text-gray-400">By: {v.created_by}</span>
              </div>
              {v.file_url && (
                <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">Download</a>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 