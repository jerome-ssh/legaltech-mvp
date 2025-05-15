import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DocumentCommentsProps {
  documentId: string;
}

export default function DocumentComments({ documentId }: DocumentCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from("document_comments")
          .select("id, comment_text, author_id, created_at")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setComments(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [documentId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (comments.length === 0) return <div className="text-gray-500">No comments found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {comments.map(c => (
            <li key={c.id} className="border-b py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.author_id}</span>
                <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm mt-1">{c.comment_text}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 