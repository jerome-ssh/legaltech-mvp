import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface MatterSearchProps {
  totalPages: number;
  currentPage: number;
  filters: {
    q: string;
    status: string;
    priority: string;
    sortBy: string;
    sortDirection: string;
    page: number;
  };
  onChange: (filters: {
    q: string;
    status: string;
    priority: string;
    sortBy: string;
    sortDirection: string;
    page: number;
  }) => void;
  sortOptions: SortOption[];
}

export function MatterSearch({ totalPages, currentPage, filters, onChange, sortOptions }: MatterSearchProps) {
  // Controlled state from parent
  const { q, status, priority, sortBy, sortDirection, page } = filters;

  // Keep currentPage in sync with filters.page
  useEffect(() => {
    if (currentPage !== page) {
      onChange({ ...filters, page: currentPage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleInputChange = (field: keyof typeof filters, value: string) => {
    onChange({ ...filters, [field]: value, page: 1 });
  };

  const handleSortDirection = () => {
    onChange({ ...filters, sortDirection: sortDirection === 'asc' ? 'desc' : 'asc', page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    onChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matters..."
            value={q}
            onChange={(e) => handleInputChange('q', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onChange({ ...filters, page: 1 })}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(val) => handleInputChange('status', val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(val) => handleInputChange('priority', val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => onChange({ ...filters, page: 1 })}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(val) => handleInputChange('sortBy', val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSortDirection}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 