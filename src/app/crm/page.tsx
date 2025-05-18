"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Star, Search, Mail, Phone, MessageCircle, Zap, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/crm/ClientsTab";
import { LeadsTab } from "@/components/crm/LeadsTab";
import { MessagesTab } from "@/components/crm/MessagesTab";

const clients = [
  {
    name: "Acme Corp",
    email: "acme@exampole.com",
    phone: "(555) 123-4557",
    status: "At Risk: No recent activity",
    statusType: "at-risk",
    amountDue: null,
    cases: 0,
    details: "At Risk",
  },
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "(553) 987-6543",
    status: "Overdue",
    statusType: "overdue",
    amountDue: "$1,500",
    cases: 1,
    details: "Overdue",
  },
  {
    name: "Big Bank",
    email: "contact@biguank.com",
    phone: "(555) 555-5555",
    status: "Likely to Retain",
    statusType: "likely",
    amountDue: null,
    cases: 3,
    details: "Likely to Retain",
  },
  {
    name: "Mary Johnson",
    email: "mary@example.com",
    phone: "(555) 777-3988",
    status: "No issues detected",
    statusType: "ok",
    amountDue: "$0 Due",
    cases: 0,
    details: "No issues detected",
  },
];

const tabs = ["Clients", "Leads", "Communications"];

type Lead = { id: number; name: string; source: string; value: string };
const leadsData: Record<string, Lead[]> = {
  Inquiry: [
    { id: 1, name: "Jane Doe", source: "Website", value: "$5,000" },
    { id: 2, name: "Acme Inc.", source: "Referral", value: "$2,500" },
  ],
  Consultation: [
    { id: 3, name: "Bob Smith", source: "LinkedIn", value: "$3,000" },
  ],
  Proposal: [
    { id: 4, name: "Global Corp", source: "Event", value: "$8,000" },
  ],
  Retained: [
    { id: 5, name: "Mary Lee", source: "Website", value: "$10,000" },
  ],
};
const leadColumns = ["Inquiry", "Consultation", "Proposal", "Retained"];

const communications = [
  {
    id: 1,
    type: "Email",
    subject: "Welcome to LawMate!",
    sender: "support@lawmate.com",
    date: "2024-07-01T10:00:00Z",
    content: "Your account has been created. Let us know if you need help!",
  },
  {
    id: 2,
    type: "Call",
    subject: "Consultation Call",
    sender: "John Smith",
    date: "2024-06-30T15:30:00Z",
    content: "Discussed case details and next steps.",
  },
  {
    id: 3,
    type: "Message",
    subject: "Document Uploaded",
    sender: "Acme Corp",
    date: "2024-06-29T09:15:00Z",
    content: "Uploaded contract draft for review.",
  },
];

const leadStatusMap: Record<string, string[]> = {
  Inquiry: ["inquiry"],
  Consultation: ["consultation"],
  Proposal: ["proposal"],
  Retained: ["retained"]
};

export default function CRMPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">CRM Dashboard</h1>
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="messages">Communications</TabsTrigger>
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