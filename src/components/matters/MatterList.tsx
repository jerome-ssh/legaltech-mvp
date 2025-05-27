import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface Matter {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  client_name?: string;
}

interface MatterListProps {
  matters: Matter[];
}

const getPriorityColor = (priority: string | null | undefined) => {
  if (!priority) return 'bg-gray-100 text-gray-800';
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function MatterList({ matters }: MatterListProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matters.map((matter) => (
            <TableRow
              key={matter.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/matters/${matter.id}`)}
            >
              <TableCell className="font-medium">{matter.title}</TableCell>
              <TableCell>{matter.client_name || '-'}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(matter.status)}>
                  {matter.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(matter.priority)}>
                  {matter.priority || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(matter.created_at).toLocaleDateString()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 