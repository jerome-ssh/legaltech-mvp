"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/crm/ClientsTab";
import { LeadsTab } from "@/components/crm/LeadsTab";
import { MessagesTab } from "@/components/crm/MessagesTab";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";

export default function CRMPage() {
  const { isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const defaultTab = tabParam === 'messages' ? 'messages' : 'clients';

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
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Please sign in to access the CRM dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">CRM Dashboard</h1>
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="leads">
          <LeadsTab />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 