"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Calendar, User, Tag } from "lucide-react";
import dynamic from 'next/dynamic';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

interface Matter {
  id: string;
  title: string;
  status: string;
  created_at: string;
  client_name: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

export default function Matters() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);

  // Clerk authentication check
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    async function fetchMatters() {
      try {
        // Get the current user's profile_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user?.id)
          .single();

        if (profileError) throw profileError;
        if (!profile) throw new Error('Profile not found');
        const profileId = profile.id;

        // Fetch matters for this profile
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMatters(data || []);
      } catch (error) {
        console.error('Error fetching matters:', error);
        setMatters([]);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchMatters();
    }
  }, [user?.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-500";
      case "Medium":
        return "text-yellow-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-blue-500";
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <LayoutWithSidebar>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Matters</h1>
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => router.push('/matters/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Matter
          </Button>
        </div>

        {/* Matters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))
          ) : matters.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matters yet</h3>
              <p className="text-gray-500 mb-4">Create your first matter to get started</p>
              <Button 
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => router.push('/matters/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Matter
              </Button>
            </div>
          ) : (
            // Matter cards
            matters.map((matter) => (
              <Card 
                key={matter.id} 
                className="shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/matters/${matter.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{matter.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(matter.priority)}`}>
                      {matter.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{matter.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{matter.client_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(matter.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
} 