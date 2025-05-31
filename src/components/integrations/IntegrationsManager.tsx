'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Mail, 
  CreditCard, 
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { AddIntegrationModal } from './AddIntegrationModal';

interface Integration {
  id: string;
  type: string;
  status: 'active' | 'inactive' | 'pending' | 'error';
  provider: string;
  lastSync?: string;
}

export function IntegrationsManager() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [integrations, setIntegrations] = useState<Record<string, Integration[]>>({
    calendar: [
      {
        id: '1',
        type: 'calendar',
        status: 'active',
        provider: 'Google Calendar',
        lastSync: '2024-03-20T10:00:00Z'
      }
    ],
    email: [
      {
        id: '2',
        type: 'email',
        status: 'active',
        provider: 'Gmail',
        lastSync: '2024-03-20T10:00:00Z'
      }
    ],
    payment: [
      {
        id: '3',
        type: 'payment',
        status: 'pending',
        provider: 'Stripe'
      }
    ]
  });

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    }
  };

  const handleAddIntegration = (data: { provider: string; credentials: Record<string, string> }) => {
    // TODO: Call API to add integration
    console.log('Adding integration:', data);
    
    // Mock adding new integration
    const newIntegration: Integration = {
      id: Math.random().toString(),
      type: activeTab,
      status: 'pending',
      provider: data.provider,
    };

    setIntegrations(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newIntegration]
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <AddIntegrationModal 
          type={activeTab as 'calendar' | 'email' | 'payment'} 
          onAdd={handleAddIntegration} 
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="border-4 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-blue-400">
            <CardHeader>
              <CardTitle>Calendar Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.calendar.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="w-6 h-6" />
                      <div>
                        <h3 className="font-medium">{integration.provider}</h3>
                        <p className="text-sm text-gray-500">
                          Last synced: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(integration.status)}
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="border-4 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-blue-400">
            <CardHeader>
              <CardTitle>Email Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.email.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Mail className="w-6 h-6" />
                      <div>
                        <h3 className="font-medium">{integration.provider}</h3>
                        <p className="text-sm text-gray-500">
                          Last synced: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(integration.status)}
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="border-4 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-blue-400">
            <CardHeader>
              <CardTitle>Payment Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.payment.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="w-6 h-6" />
                      <div>
                        <h3 className="font-medium">{integration.provider}</h3>
                        <p className="text-sm text-gray-500">
                          Payment processing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(integration.status)}
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 