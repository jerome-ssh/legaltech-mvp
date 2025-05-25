import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Activity, Phone, Mail, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';
import { motion } from 'framer-motion';

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

interface Matter {
  id: string;
  client_id: string;
  status: string;
}

interface ClientsTabContentProps {
  shouldFetch: boolean;
}

function ClientsTabContent({ shouldFetch }: ClientsTabContentProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!shouldFetch) return;
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch clients and matters in parallel
        const [clientsResponse, mattersResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/matters')
        ]);

        if (!clientsResponse.ok) {
          const errorData = await clientsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch clients');
        }
        if (!mattersResponse.ok) {
          const errorData = await mattersResponse.json();
          throw new Error(errorData.error || 'Failed to fetch matters');
        }

        const [clientsData, mattersData] = await Promise.all([
          clientsResponse.json(),
          mattersResponse.json()
        ]);

        if (mounted) {
          setClients(Array.isArray(clientsData.data) ? clientsData.data : []);
          setMatters(Array.isArray(mattersData.data) ? mattersData.data : []);
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
  }, [shouldFetch]);

  const handleAddClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          address: '',
          city: '',
          state: '',
          zip_code: ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const data = await response.json();
      setClients(prev => [...prev, data.data]);
    } catch (err) {
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      const data = await response.json();
      setClients(prev => prev.map(client => 
        client.id === id ? data.data : client
      ));
    } catch (err) {
      console.error('Error updating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to update client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('Error deleting client:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  const filteredClients = clients.filter(client => 
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
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
        <p className="text-red-500 dark:text-red-400">Error loading clients: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Clients</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20"
            />
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            onClick={handleAddClient}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const clientMatters = matters.filter((m) => m.client_id === client.id);
          const openMatters = clientMatters.filter((m) => m.status === 'open').length;

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        {client.first_name} {client.last_name}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 mr-2" />
                          <p className="text-sm">{client.email}</p>
                        </div>
                        {client.phone_number && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <Phone className="w-4 h-4 mr-2" />
                            <p className="text-sm">{client.phone_number}</p>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 mr-2" />
                            <p className="text-sm">
                              {client.address}
                              {client.city && `, ${client.city}`}
                              {client.state && `, ${client.state}`}
                              {client.zip_code && ` ${client.zip_code}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-800/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-600 dark:text-gray-300">
                          <Activity className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {clientMatters.length} Matter{clientMatters.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                          {openMatters} Open
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ClientsTab({ shouldFetch }: { shouldFetch: boolean }) {
  return (
    <CRMErrorBoundary>
      <ClientsTabContent shouldFetch={shouldFetch} />
    </CRMErrorBoundary>
  );
} 