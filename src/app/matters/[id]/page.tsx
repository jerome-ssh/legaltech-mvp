// NOTE: 'case' = 'matter' in UI/UX/backend
// This file handles individual matter detail pages

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import MatterStatus from '@/components/matters/MatterStatus';
import MatterSummary from '@/components/matters/MatterSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatterPageProps {
  params: {
    id: string;
  };
}

export default async function MatterPage({ params }: MatterPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect('/login');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: matter, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single();

  if (error || !matter) {
    redirect('/matters');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{matter.title}</h1>
        <MatterStatus
          matterId={matter.id}
          currentStatus={matter.status}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Matter Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{matter.description || 'No description available'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(matter.created_at).toLocaleDateString()}
                </dd>
              </div>
              {matter.end_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Closed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(matter.end_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <MatterSummary
          matterId={matter.id}
          initialSummary={matter.ai_summary}
        />
      </div>
    </div>
  );
} 