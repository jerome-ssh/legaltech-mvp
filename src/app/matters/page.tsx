"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Calendar, User, Tag } from "lucide-react";
import dynamic from 'next/dynamic';
import { MatterSearch } from '@/components/matters/MatterSearch';
import { MatterCard } from '@/components/matters/MatterCard';
import { useToast } from '@/components/ui/use-toast';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

// NOTE: 'case' = 'matter' in UI/UX/backend
// This file handles the main matters listing page

interface Matter {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
  created_at: string;
  updated_at: string;
  matter_status: {
    status: string;
    changed_at: string;
  }[];
  matter_billing: {
    billing_type: string;
    rate: number;
    currency: string;
  } | null;
}

export default function Matters() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchMatters = async (params: {
    q: string;
    status: string;
    priority: string;
    sortBy: string;
    sortDirection: string;
    page: number;
  }) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (params.q) queryParams.set('q', params.q);
      if (params.status) queryParams.set('status', params.status);
      if (params.priority) queryParams.set('priority', params.priority);
      queryParams.set('sortBy', params.sortBy);
      queryParams.set('sortDirection', params.sortDirection);
      queryParams.set('page', params.page.toString());
      queryParams.set('pageSize', '10');

      const response = await fetch(`/api/matters/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch matters');

      const data = await response.json();
      setMatters(data.matters);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.page);

      // Update URL with search params
      router.push(`/matters?${queryParams.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Error fetching matters:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch matters. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize with URL params or defaults
    const params = {
      q: searchParams?.get('q') ?? '',
      status: searchParams?.get('status') ?? '',
      priority: searchParams?.get('priority') ?? '',
      sortBy: searchParams?.get('sortBy') ?? 'created_at',
      sortDirection: searchParams?.get('sortDirection') ?? 'desc',
      page: parseInt(searchParams?.get('page') ?? '1')
    };
    fetchMatters(params);
  }, []);

  const handleSearch = (params: {
    q: string;
    status: string;
    priority: string;
    sortBy: string;
    sortDirection: string;
    page: number;
  }) => {
    fetchMatters(params);
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

        <MatterSearch
          totalPages={totalPages}
          currentPage={currentPage}
          onSearch={handleSearch}
        />

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
              <MatterCard key={matter.id} matter={matter} />
            ))
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
} 