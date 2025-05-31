import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, AlertTriangle, CheckCircle2, Calendar, Users, Shield, FileText } from 'lucide-react';

interface AnalysisResult {
  summary: string;
  key_points: string[];
  risk_level: string;
  risk_factors: string[];
  suggested_actions: string[];
  compliance_requirements: string[];
  parties_involved: {
    primary: string[];
    secondary: string[];
  };
  critical_dates: Array<{
    date: string;
    description: string;
  }>;
}

interface DocumentAnalysisProps {
  documentId: string;
  matterId: string;
  matterType?: string;
  initialAnalysis?: AnalysisResult;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

export function DocumentAnalysis({ 
  documentId, 
  matterId,
  matterType = 'default',
  initialAnalysis,
  onAnalysisComplete 
}: DocumentAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeDocument = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await fetch(`/api/matters/${matterId}/documents/${documentId}/analyze`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAnalysis = () => {
    if (!analysis) return;

    const content = `Document Analysis Report
=====================

Summary:
${analysis.summary}

Key Points:
${analysis.key_points.map(point => `- ${point}`).join('\n')}

Risk Assessment:
Level: ${analysis.risk_level}
Factors:
${analysis.risk_factors.map(factor => `- ${factor}`).join('\n')}

Suggested Actions:
${analysis.suggested_actions.map(action => `- ${action}`).join('\n')}

Compliance Requirements:
${analysis.compliance_requirements.map(req => `- ${req}`).join('\n')}

Parties Involved:
Primary:
${analysis.parties_involved.primary.map(party => `- ${party}`).join('\n')}
Secondary:
${analysis.parties_involved.secondary.map(party => `- ${party}`).join('\n')}

Critical Dates:
${analysis.critical_dates.map(date => `- ${date.date}: ${date.description}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-analysis-${documentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          {matterType.charAt(0).toUpperCase() + matterType.slice(1)} Document Analysis
        </CardTitle>
        <div className="flex gap-2">
          {analysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAnalysis}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          <Button
            onClick={analyzeDocument}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-gray-600">{analysis.summary}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Key Points</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {analysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Risk Assessment</h3>
              <div className="space-y-2">
                <Badge className={getRiskLevelColor(analysis.risk_level)}>
                  {analysis.risk_level}
                </Badge>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {analysis.risk_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Suggested Actions</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {analysis.suggested_actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Compliance Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {analysis.compliance_requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Parties Involved</h3>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Primary</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {analysis.parties_involved.primary.map((party, index) => (
                      <li key={index}>{party}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Secondary</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {analysis.parties_involved.secondary.map((party, index) => (
                      <li key={index}>{party}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Critical Dates</h3>
              <div className="space-y-2">
                {analysis.critical_dates.map((date, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{date.date}</p>
                      <p className="text-gray-600">{date.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Click "Analyze Document" to begin analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
} 