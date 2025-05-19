"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/crm/ClientsTab";
import { LeadsTab } from "@/components/crm/LeadsTab";
import { MessagesTab } from "@/components/crm/MessagesTab";
import { SchedulesTab } from "@/components/crm/SchedulesTab";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from 'next/navigation';

export default function CRMPage() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    if (!searchParams) return 'clients';
    const tab = searchParams.get('tab');
    return tab && ['clients', 'leads', 'messages', 'schedules'].includes(tab) ? tab : 'clients';
  });

  useEffect(() => {
    if (!searchParams) return;
    const tab = searchParams.get('tab');
    if (tab && ['clients', 'leads', 'messages', 'schedules'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-6 bg-white dark:bg-[#1a2540]/50 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to access the CRM dashboard.
          </p>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, '', `/crm?tab=${value}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent dark:text-white">
          CRM Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your clients, leads, messages, and schedules in one place.
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent">
          <TabsTrigger value="clients" className="min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            Clients
          </TabsTrigger>
          <TabsTrigger value="leads" className="min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            Leads
          </TabsTrigger>
          <TabsTrigger value="messages" className="min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            Messages
          </TabsTrigger>
          <TabsTrigger value="schedules" className="min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            Schedules
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <ClientsTab shouldFetch={activeTab === 'clients'} />
        </TabsContent>
        <TabsContent value="leads">
          <LeadsTab shouldFetch={activeTab === 'leads'} />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab shouldFetch={activeTab === 'messages'} />
        </TabsContent>
        <TabsContent value="schedules">
          <SchedulesTab shouldFetch={activeTab === 'schedules'} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 