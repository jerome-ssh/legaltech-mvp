import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, Tag } from 'lucide-react';

interface Matter {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  client_name: string;
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
    priority?: {
      name: string;
    };
  } | null;
}

interface MatterCardProps {
  matter: Matter;
}

const getPriorityColor = (priority: string) => {
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

export function MatterCard({ matter }: MatterCardProps) {
  const router = useRouter();
  const latestStatus = matter.matter_status?.[0]?.status || matter.status || 'Active';
  const priorityName = matter.matter_billing?.priority?.name || 'Medium';

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => router.push(`/matters/${matter.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{matter.title}</h3>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priorityName)}`}>
              {priorityName}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(latestStatus)}`}>
              {latestStatus}
            </span>
          </div>
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
          {matter.matter_billing && (
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              <span>
                {matter.matter_billing.billing_type} - {matter.matter_billing.rate} {matter.matter_billing.currency}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 