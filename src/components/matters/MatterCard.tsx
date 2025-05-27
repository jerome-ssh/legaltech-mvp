import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, Tag, Briefcase, MapPin, Clock, Users, Zap, FileText, Scale, Lightbulb, Home, Calculator, Shield, DollarSign } from 'lucide-react';
import { Matter } from '@/types/matter';
import { ProgressBar } from './ProgressBar';
import { TaskList } from './TaskList';
import { useState } from 'react';
import { getCountryNameByCode } from '@/lib/geo-data';

interface MatterCardProps {
  matter: Matter & { rate?: number; currency?: string; billing_method?: string };
  onStatusChange?: (matterId: string, newStatus: string) => void;
}

export function MatterCard({ matter, onStatusChange }: MatterCardProps) {
  const router = useRouter();
  const [showTasks, setShowTasks] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'corporate':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'contract':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'litigation':
        return <Scale className="w-4 h-4 text-red-400" />;
      case 'intellectual property':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'real estate':
        return <Home className="w-4 h-4 text-green-400" />;
      case 'tax':
        return <Calculator className="w-4 h-4 text-indigo-400" />;
      case 'regulatory':
        return <Shield className="w-4 h-4 text-gray-400" />;
      default:
        return <Briefcase className="w-4 h-4 text-gray-400" />;
    }
  };

  // Colorful creative card background
  const cardBg = 'bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-100 shadow-md';

  return (
    <Card className={`overflow-hidden ${cardBg} hover:shadow-xl transition-shadow duration-200 cursor-pointer rounded-xl`} onClick={() => router.push(`/matters/${matter.id}`)}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Top: Client avatar, status, priority */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {/* Client avatar or fallback icon */}
            {matter.client_avatar_url ? (
              <img src={matter.client_avatar_url} alt="Client Avatar" className="w-10 h-10 rounded-full border border-blue-200 shadow-sm object-cover" />
            ) : (
              <User className="w-10 h-10 text-blue-300 bg-blue-100 rounded-full p-1" />
            )}
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Client</span>
              <span className="text-lg font-bold text-gray-900 truncate max-w-[140px]">{matter.client_name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(matter.status)}`}>{matter.status}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(matter.priority)}`}>{matter.priority}</span>
          </div>
        </div>

        {/* Title and type */}
        <div className="flex items-center gap-2 mt-1">
          {getTypeIcon(matter.matter_type || '')}
          <span className="text-xs text-gray-400 font-medium">Title</span>
          <h3 className="text-sm font-semibold text-gray-800 truncate hover:text-blue-600 transition-colors duration-200" title={matter.title}>{matter.title}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{matter.matter_type || 'Unspecified'}</span>
          {matter.matter_sub_type && <span className="ml-1 text-gray-400">({matter.matter_sub_type})</span>}
        </div>

        {/* Meta grid: jurisdiction, billing method, created, deadline, rate */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-1">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span className="truncate" title={matter.jurisdiction}>{getCountryNameByCode(matter.jurisdiction || '') || matter.jurisdiction}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-gray-400" />
            <span className="truncate" title={matter.billing_method || 'N/A'}>{matter.billing_method || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{new Date(matter.created_at).toLocaleDateString()}</span>
          </div>
          {matter.deadline && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" />
              <span>{new Date(matter.deadline).toLocaleDateString()}</span>
            </div>
          )}
          {(typeof matter.rate === 'number' && matter.rate > 0) ? (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="truncate" title={matter.rate.toLocaleString()}>
                {matter.rate.toLocaleString()}{matter.currency ? ` ${matter.currency}` : ''}
              </span>
            </div>
          ) : (
            matter.estimated_value && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-400" />
                <span className="truncate" title={matter.estimated_value.toLocaleString ? matter.estimated_value.toLocaleString() : String(matter.estimated_value)}>{matter.estimated_value.toLocaleString ? matter.estimated_value.toLocaleString() : String(matter.estimated_value)}</span>
              </div>
            )
          )}
        </div>

        {/* Tags */}
        {matter.tags && matter.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <Tag className="w-3 h-3 text-purple-400" />
            {matter.tags.map((tag: string, idx: number) => (
              <span key={idx} className="bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 text-[10px] font-medium">{tag}</span>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="border-t border-blue-100 pt-3">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium flex items-center gap-1 text-blue-700">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Progress</span>
            </h4>
            <button
              onClick={e => { e.stopPropagation(); setShowTasks(!showTasks); }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200 px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              {showTasks ? 'Hide Tasks' : 'Show Tasks'}
            </button>
          </div>
          <ProgressBar progress={{...matter.progress, overall: (typeof matter.progress?.overall === 'number' && !isNaN(matter.progress.overall)) ? matter.progress.overall : 0}} showDetails={showTasks} />
        </div>

        {/* Task list (expandable) */}
        {showTasks && (
          <div className="border-t border-blue-100 pt-2" onClick={e => e.stopPropagation()}>
            <TaskList matterId={matter.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add this to your global CSS if not present:
// .shadow-glow {
//   box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.5), 0 0 2px 1px rgba(59, 130, 246, 0.3);
// } 