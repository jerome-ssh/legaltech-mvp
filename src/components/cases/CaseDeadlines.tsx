import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseDeadlinesProps {
  caseId: string;
}

export default function CaseDeadlines({ caseId }: CaseDeadlinesProps) {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchDeadlines = async () => {
      try {
        const { data, error } = await supabase
          .from("deadlines")
          .select("id, name, due_date, status, description")
          .eq("case_id", caseId)
          .order("due_date", { ascending: true });
        if (error) throw error;
        setDeadlines(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDeadlines();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (deadlines.length === 0) return <div className="text-gray-500">No deadlines found.</div>;

  return (
    <Card className="mt-4 border-4 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-blue-400">
      <CardHeader>
        <CardTitle>Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {deadlines.map(d => (
            <li key={d.id} className="border-b py-2">
              <div className="font-semibold">{d.name}</div>
              <div className="text-xs text-gray-500">Due: {d.due_date}</div>
              <div className="text-xs text-gray-400">Status: {d.status}</div>
              {d.description && <div className="text-xs text-gray-600 mt-1">{d.description}</div>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 