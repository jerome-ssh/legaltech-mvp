import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface TimeEntryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TimeEntryForm({ onClose, onSuccess }: TimeEntryFormProps) {
  const { user, isLoaded } = useUser();
  const [form, setForm] = useState({
    case_id: "",
    description: "",
    hours: "",
    date: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!isLoaded || !user) return;
    setCasesLoading(true);
    setCasesError(null);
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("id, name, case_participants!inner(user_id)")
          .eq("case_participants.user_id", user.id)
          .order("name");
        if (error) throw error;
        setCases(data || []);
      } catch (err: any) {
        setCasesError(err.message);
      } finally {
        setCasesLoading(false);
      }
    };
    fetchCases();
  }, [isLoaded, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("time_entries").insert({
        case_id: form.case_id,
        description: form.description,
        hours: Number(form.hours),
        date: form.date,
        status: form.status,
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-lg">
        <h2 className="text-lg font-bold mb-2">Log Time Entry</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Case</label>
          {casesLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading cases...</div>
          ) : casesError ? (
            <div className="text-red-500 text-sm">{casesError}</div>
          ) : (
            <select
              name="case_id"
              value={form.case_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a case</option>
              {cases.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input name="description" value={form.description} onChange={handleChange} required disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hours</label>
          <Input name="hours" type="number" min="0" step="0.1" value={form.hours} onChange={handleChange} required disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input name="date" type="date" value={form.date} onChange={handleChange} required disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} disabled={loading} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Log Entry
          </Button>
        </div>
      </form>
    </div>
  );
} 