import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseStagesProps {
  caseId: string;
}

export default function CaseStages({ caseId }: CaseStagesProps) {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchStages = async () => {
      try {
        const { data, error } = await supabase
          .from("case_stages")
          .select("id, name, status, start_date, end_date")
          .eq("case_id", caseId)
          .order("start_date", { ascending: true });
        if (error) throw error;
        setStages(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStages();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (stages.length === 0) return <div className="text-gray-500">No stages found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Case Stages</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {stages.map(s => (
            <li key={s.id} className="border-b py-2">
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-500">Status: {s.status}</div>
              <div className="text-xs text-gray-400">{s.start_date} - {s.end_date || 'Ongoing'}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 