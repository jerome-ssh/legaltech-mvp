// NOTE: 'case' = 'matter' in UI/UX/backend
// This file handles individual matter detail pages

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Tag, FileText, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

interface Matter {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  client_name: string;
  created_at: string;
  updated_at: string;
  matter_status: {
    status: string;
    changed_at: string;
    notes?: string;
    changed_by?: string;
  }[];
  matter_billing: {
    billing_type: string;
    rate: number;
    currency: string;
    payment_terms?: string;
    retainer_amount?: number;
    retainer_balance?: number;
    billing_frequency?: string;
    custom_frequency?: string;
    billing_notes?: string;
  } | null;
  matter_intake_links: {
    id: string;
    token: string;
    status: string;
    sent_at: string;
    expires_at: string;
    completed_at?: string;
    form_data?: any;
  }[];
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function MatterDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { toast } = useToast();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    async function fetchMatter() {
      try {
        const response = await fetch(`/api/matters/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch matter details');
        
        const data = await response.json();
        setMatter(data);
      } catch (error) {
        console.error('Error fetching matter:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matter details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchMatter();
    }
  }, [params.id, user?.id]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <LayoutWithSidebar>
        <div className="p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  if (!matter) {
    return (
      <LayoutWithSidebar>
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Matter Not Found</h2>
            <p className="text-gray-600 mb-6">The matter you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/matters')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matters
            </Button>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  const latestStatus = matter.matter_status?.[0]?.status || matter.status;

  return (
    <LayoutWithSidebar>
      <div className="p-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/matters')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matters
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{matter.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{matter.client_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(matter.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(matter.priority)}>
                {matter.priority}
              </Badge>
              <Badge className={getStatusColor(latestStatus)}>
                {latestStatus}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">Status History</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="intake">Intake Forms</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {matter.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matter.matter_status?.map((status, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(status.changed_at).toLocaleString()}
                          </span>
                        </div>
                        {status.notes && (
                          <p className="mt-1 text-sm text-gray-600">{status.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                {matter.matter_billing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Billing Type</h3>
                        <p className="mt-1">{matter.matter_billing.billing_type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Rate</h3>
                        <p className="mt-1">
                          {matter.matter_billing.rate} {matter.matter_billing.currency}
                        </p>
                      </div>
                      {matter.matter_billing.payment_terms && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Payment Terms</h3>
                          <p className="mt-1">{matter.matter_billing.payment_terms}</p>
                        </div>
                      )}
                      {matter.matter_billing.billing_frequency && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Billing Frequency</h3>
                          <p className="mt-1">
                            {matter.matter_billing.billing_frequency}
                            {matter.matter_billing.custom_frequency && ` (${matter.matter_billing.custom_frequency})`}
                          </p>
                        </div>
                      )}
                    </div>
                    {matter.matter_billing.retainer_amount && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Retainer</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="mt-1">
                              {matter.matter_billing.retainer_amount} {matter.matter_billing.currency}
                            </p>
                          </div>
                          {matter.matter_billing.retainer_balance !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500">Balance</p>
                              <p className="mt-1">
                                {matter.matter_billing.retainer_balance} {matter.matter_billing.currency}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {matter.matter_billing.billing_notes && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {matter.matter_billing.billing_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No billing information available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intake">
            <Card>
              <CardHeader>
                <CardTitle>Intake Forms</CardTitle>
              </CardHeader>
              <CardContent>
                {matter.matter_intake_links?.length > 0 ? (
                  <div className="space-y-4">
                    {matter.matter_intake_links.map((link) => (
                      <div key={link.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Intake Form</span>
                          </div>
                          <Badge className={getStatusColor(link.status)}>
                            {link.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <p>Sent: {new Date(link.sent_at).toLocaleString()}</p>
                            <p>Expires: {new Date(link.expires_at).toLocaleString()}</p>
                          </div>
                          {link.completed_at && (
                            <div>
                              <p>Completed: {new Date(link.completed_at).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {link.form_data && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Form Data</h4>
                            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                              {JSON.stringify(link.form_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No intake forms available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
} 