import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CaseMessagesProps {
  caseId: string;
}

export default function CaseMessages({ caseId }: CaseMessagesProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, message_text, sender_id, created_at")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setMessages(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [caseId]);

  if (loading) return <div className="py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (messages.length === 0) return <div className="text-gray-500">No messages found.</div>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {messages.map(m => (
            <li key={m.id} className="border-b py-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{m.sender_id}</span>
                <span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm mt-1">{m.message_text}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 