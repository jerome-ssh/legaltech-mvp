"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import CaseTeam from "@/components/cases/CaseTeam";
import CaseStages from "@/components/cases/CaseStages";
import CaseActivityLog from "@/components/cases/CaseActivityLog";
import CaseNotes from "@/components/cases/CaseNotes";
import CaseDeadlines from "@/components/cases/CaseDeadlines";
import CaseMessages from "@/components/cases/CaseMessages";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    const fetchCase = async () => {
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .eq("id", caseId)
          .single();
        if (error) throw error;
        setCaseData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!caseData) return <div className="text-gray-500">Case not found.</div>;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{caseData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-gray-500">Type: {caseData.type}</div>
          <div className="mb-2 text-sm text-gray-500">Status: {caseData.status}</div>
          <div className="mb-2 text-xs text-gray-400">Last updated: {new Date(caseData.updated_at).toLocaleString()}</div>
        </CardContent>
      </Card>
      <CaseTeam caseId={caseId} />
      <CaseStages caseId={caseId} />
      <CaseActivityLog caseId={caseId} />
      <CaseNotes caseId={caseId} />
      <CaseDeadlines caseId={caseId} />
      <CaseMessages caseId={caseId} />
    </div>
  );
} 