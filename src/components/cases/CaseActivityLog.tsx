import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseActivityLogProps {
  caseId: string;
}

export default function CaseActivityLog({ caseId }: CaseActivityLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, actor_id, timestamp, details")
          .eq("case_id", caseId)
          .order("timestamp", { ascending: false });
        if (error) throw error;
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (logs.length === 0) return <div className="text-gray-500">No activity log entries found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {logs.map(log => (
            <li key={log.id} className="border-b py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{log.action}</span>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                <span className="text-xs text-gray-400">By: {log.actor_id}</span>
              </div>
              {log.details && <div className="text-xs text-gray-600 mt-1">{log.details}</div>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 