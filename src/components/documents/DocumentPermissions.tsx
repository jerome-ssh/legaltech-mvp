import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DocumentPermissionsProps {
  documentId: string;
}

export default function DocumentPermissions({ documentId }: DocumentPermissionsProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from("document_permissions")
          .select("id, user_id, team_id, permission_type, status")
          .eq("document_id", documentId);
        if (error) throw error;
        setPermissions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [documentId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (permissions.length === 0) return <div className="text-gray-500">No permissions found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Document Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {permissions.map(p => (
            <li key={p.id} className="flex items-center justify-between border-b py-2">
              <div>
                <span className="font-semibold">{p.user_id ? `User: ${p.user_id}` : `Team: ${p.team_id}`}</span>
                <span className="ml-2 text-xs text-gray-500">Type: {p.permission_type}</span>
                <span className="ml-2 text-xs text-gray-400">Status: {p.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 