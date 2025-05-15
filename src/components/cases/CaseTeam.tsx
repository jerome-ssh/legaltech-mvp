import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseTeamProps {
  caseId: string;
}

export default function CaseTeam({ caseId }: CaseTeamProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("case_team_members")
          .select("id, role, status, profiles:profile_id(first_name, last_name, email)")
          .eq("case_id", caseId);
        if (error) throw error;
        setMembers(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (members.length === 0) return <div className="text-gray-500">No team members found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Case Team</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {members.map(m => (
            <li key={m.id} className="flex items-center justify-between border-b py-2">
              <div>
                <span className="font-semibold">{m.profiles?.first_name} {m.profiles?.last_name}</span>
                <span className="ml-2 text-xs text-gray-500">Role: {m.role}</span>
                <span className="ml-2 text-xs text-gray-400">Status: {m.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 