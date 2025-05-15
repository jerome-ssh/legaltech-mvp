"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";

export default function AddTimeEntryPage() {
  const params = useParams();
  const router = useRouter();
  const billingId = params?.id as string;
  const { user } = useUser();
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    case_id: "",
    user_id: user?.id || "",
    description: "",
    duration: "",
    rate: "",
    date: "",
    start_time: "",
    end_time: "",
    billable_status: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBilling() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("billing")
        .select("id, case_id")
        .eq("id", billingId)
        .single();
      if (error) setError(error.message);
      else {
        setBilling(data);
        setForm(f => ({ ...f, case_id: data?.case_id || "" }));
      }
      setLoading(false);
    }
    if (billingId) fetchBilling();
  }, [billingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("time_entries").insert([
      {
        billing_id: billingId,
        case_id: form.case_id,
        user_id: form.user_id,
        description: form.description,
        duration: form.duration,
        rate: form.rate,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        billable_status: form.billable_status,
      },
    ]);
    setSubmitting(false);
    if (error) setError(error.message);
    else router.push(`/dashboard/billing/${billingId}`);
  };

  if (loading) return <div>Loading billing record...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!billing) return <div>Billing record not found.</div>;

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-bold mb-4">Add Time Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Description</label>
            <Textarea name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium">Duration (e.g. 01:30:00)</label>
            <Input name="duration" value={form.duration} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium">Rate</label>
            <Input name="rate" type="number" value={form.rate} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium">Date</label>
            <Input name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block font-medium">Start Time</label>
              <Input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium">End Time</label>
              <Input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              name="billable_status"
              checked={form.billable_status}
              onCheckedChange={checked => setForm(f => ({ ...f, billable_status: Boolean(checked) }))}
            />
            <label>Billable</label>
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Add Time Entry"}</Button>
          {error && <div className="text-red-500">{error}</div>}
        </form>
      </CardContent>
    </Card>
  );
} 