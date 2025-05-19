'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { ClientIntakeForm } from '@/components/matters/ClientIntakeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntakeFormPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/intake/${params.token}`);
        if (!response.ok) throw new Error('Invalid or expired token');
        
        const data = await response.json();
        if (data.status === 'completed') {
          toast({
            title: 'Form Already Submitted',
            description: 'This intake form has already been completed.',
            variant: 'destructive'
          });
          router.push('/intake/thank-you');
          return;
        }

        setValid(true);
      } catch (error) {
        console.error('Error validating token:', error);
        toast({
          title: 'Error',
          description: 'This intake form link is invalid or has expired.',
          variant: 'destructive'
        });
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [params.token, router, toast]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return null;
  }

  return <ClientIntakeForm token={params.token} />;
} 