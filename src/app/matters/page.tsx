"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, LayoutGrid, List } from "lucide-react";
import dynamic from 'next/dynamic';
import { MatterSearch } from '@/components/matters/MatterSearch';
import { MatterCard } from '@/components/matters/MatterCard';
import { useToast } from '@/components/ui/use-toast';
import { MatterIntakeWizard } from '@/components/matters/MatterIntakeWizard';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useFormOptions } from '@/hooks/useFormOptions';
import { MatterList } from '@/components/matters/MatterList';
import { Input } from '@/components/ui/input';
import type { Matter, MatterProgress } from '@/types/matter';

const LayoutWithSidebar = dynamic(() => import('@/components/LayoutWithSidebar'), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-100 dark:bg-gray-800 animate-pulse" />
});

// NOTE: 'case' = 'matter' in UI/UX/backend
// This file handles the main matters listing page

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  const [showWizard, setShowWizard] = useState(false);
  const [isHoveringNewMatter, setIsHoveringNewMatter] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    q: '',
    status: 'all',
    priority: 'all',
    sortBy: 'created_at',
    sortDirection: 'desc',
    page: 1,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  const { } = useFormOptions({ 
    shouldFetch: isHoveringNewMatter 
  });

  // Clerk authentication check
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchMatters = useCallback(async (newFilters = filters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (newFilters.q) queryParams.set('q', newFilters.q);
      if (newFilters.status) queryParams.set('status', newFilters.status);
      if (newFilters.priority) queryParams.set('priority', newFilters.priority);
      queryParams.set('sortBy', newFilters.sortBy);
      queryParams.set('sortDirection', newFilters.sortDirection);
      queryParams.set('page', newFilters.page.toString());
      queryParams.set('pageSize', '10');

      const response = await fetch(`/api/matters/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch matters');

      const data = await response.json();
      const defaultProgress: MatterProgress = {
        overall: 0,
        by_stage: {},
        completed_tasks: 0,
        total_tasks: 0,
        completed_weight: 0,
        total_weight: 0,
      };
      setMatters(
        data.matters.map((matter: any) => ({
          ...matter,
          progress:
            typeof matter.progress === 'object' && matter.progress !== null
              ? matter.progress
              : defaultProgress,
        }))
      );
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.page);
      setPagination(data.pagination);

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
  }, [filters, router, toast]);

  useEffect(() => {
    // Initialize with URL params or defaults
    const params = {
      q: searchParams?.get('q') ?? '',
      status: searchParams?.get('status') ?? 'all',
      priority: searchParams?.get('priority') ?? 'all',
      sortBy: searchParams?.get('sortBy') ?? 'created_at',
      sortDirection: searchParams?.get('sortDirection') ?? 'desc',
      page: parseInt(searchParams?.get('page') ?? '1')
    };
    setFilters(params);
    fetchMatters(params);
  }, []);

  useEffect(() => {
    fetchMatters(filters);
  }, [filters, fetchMatters]);

  const handleFilterChange = (params: {
    q: string;
    status: string;
    priority: string;
    sortBy: string;
    sortDirection: string;
    page: number;
  }) => {
    setFilters({
      ...params,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
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
            onClick={() => setShowWizard(true)}
            onMouseEnter={() => setIsHoveringNewMatter(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Matter
          </Button>
        </div>

        <MatterSearch
          totalPages={totalPages}
          currentPage={currentPage}
          filters={filters}
          onChange={handleFilterChange}
          sortOptions={[
            { value: 'created_at', label: 'Created Date' },
            { value: 'title', label: 'Title' },
            { value: 'client_name', label: 'Client Name' },
          ]}
        />

        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Matters Grid */}
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
              onClick={() => setShowWizard(true)}
              onMouseEnter={() => setIsHoveringNewMatter(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Matter
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matters.map((matter) => (
              <MatterCard key={matter.id} matter={matter} />
            ))}
          </div>
        ) : (
          <MatterList matters={matters} />
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        <Dialog 
          open={showWizard} 
          onOpenChange={(open) => {
            setShowWizard(open);
            if (!open) {
              setIsHoveringNewMatter(false);
            }
          }}
        >
          <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl">
            <MatterIntakeWizard onComplete={() => {
              setShowWizard(false);
              setIsHoveringNewMatter(false);
            }} />
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWithSidebar>
  );
} 