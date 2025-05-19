'use client';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';

// NOTE: 'case' = 'matter' in UI/UX/backend
// This component handles AI-generated matter summaries

interface MatterSummaryProps {
  matterId: string;
  initialSummary?: string;
}

export default function MatterSummary({ matterId, initialSummary }: MatterSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matterId }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to generate summary');
      }

      setSummary(data.summary);

      toast({
        title: 'Summary Generated',
        description: 'AI summary has been generated successfully',
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI Summary</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="text-sm text-gray-600 whitespace-pre-wrap">
            {summary}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No summary available. Click the refresh button to generate one.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 