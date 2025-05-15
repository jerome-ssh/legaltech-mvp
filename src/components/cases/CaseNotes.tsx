import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseNotesProps {
  caseId: string;
}

export default function CaseNotes({ caseId }: CaseNotesProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("id, note_text, author_id, created_at")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setNotes(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (notes.length === 0) return <div className="text-gray-500">No notes found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="border-b py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{n.author_id}</span>
                <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm mt-1">{n.note_text}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 