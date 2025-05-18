import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: string;
}

interface Case {
  id: string;
  client_id: string;
  status: string;
}

function ClientsTabContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch clients and cases in parallel
        const [clientsResponse, casesResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/cases')
        ]);

        if (!clientsResponse.ok) {
          throw new Error('Failed to fetch clients');
        }
        if (!casesResponse.ok) {
          throw new Error('Failed to fetch cases');
        }

        const [clientsData, casesData] = await Promise.all([
          clientsResponse.json(),
          casesResponse.json()
        ]);

        if (mounted) {
          setClients(clientsData.data);
          setCases(casesData.data);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        if (mounted) {
          if (err instanceof AppError) {
            setError(err.message);
          } else if (err instanceof Error) {
            setError(`Error: ${err.message}`);
          } else {
            setError('An unexpected error occurred while loading clients');
            console.error('Unknown error type:', err);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Error loading clients: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Clients</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((client) => {
          const clientCases = cases.filter((c) => c.client_id === client.id);
          const openCases = clientCases.filter((c) => c.status === 'open').length;

          return (
            <Card
              key={client.id}
              className="bg-[#f0f6ff] dark:bg-[#1a2540] dark:text-white border-none shadow-none"
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {client.email}
                    </p>
                    {client.phone_number && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {client.phone_number}
                      </p>
                    )}
                    {client.address && (
                      <p className="text-sm text-muted-foreground">
                        {client.address}
                        {client.city && `, ${client.city}`}
                        {client.state && `, ${client.state}`}
                        {client.zip_code && ` ${client.zip_code}`}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {clientCases.length} Case{clientCases.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm font-medium text-cyan-400">
                        {openCases} Open
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ClientsTab() {
  return (
    <CRMErrorBoundary>
      <ClientsTabContent />
    </CRMErrorBoundary>
  );
} 