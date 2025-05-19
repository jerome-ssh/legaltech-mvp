import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Calendar as CalendarIcon, List, Filter, Download, Upload, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AppError } from '@/lib/errors';
import { CRMErrorBoundary } from './ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { ScheduleEventModal } from './ScheduleEventModal';

interface Schedule {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'meeting' | 'call' | 'email' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  participants: string[];
  location?: string;
  created_at: string;
  recurrence?: string;
}

type ViewMode = 'list' | 'calendar';

function expandRecurringEvents(events: Schedule[]): Schedule[] {
  const expanded: Schedule[] = [];
  const now = new Date();
  events.forEach(event => {
    expanded.push(event);
    if (event.recurrence) {
      let count = 0;
      let max = 0;
      let interval = 0;
      if (/week/i.test(event.recurrence)) {
        max = 8; interval = 7;
      } else if (/month/i.test(event.recurrence)) {
        max = 6; interval = 30;
      } else if (/2 week/i.test(event.recurrence)) {
        max = 4; interval = 14;
      } else {
        return; // skip unknown
      }
      let start = new Date(event.start_time);
      let end = new Date(event.end_time);
      for (let i = 1; i <= max; i++) {
        const nextStart = new Date(start.getTime() + i * interval * 24 * 60 * 60 * 1000);
        const nextEnd = new Date(end.getTime() + i * interval * 24 * 60 * 60 * 1000);
        if (nextStart > now) {
          expanded.push({ ...event, id: `${event.id}-rec${i}`, start_time: nextStart.toISOString(), end_time: nextEnd.toISOString() });
        }
      }
    }
  });
  return expanded;
}

interface SchedulesTabContentProps {
  shouldFetch: boolean;
}

function SchedulesTabContent({ shouldFetch }: SchedulesTabContentProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        const data = await response.json();
        if (mounted) setSchedules(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) {
          if (err instanceof AppError) setError(err.message);
          else setError('An unexpected error occurred while loading schedules');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [shouldFetch]);

  const getTypeIcon = (type: Schedule['type']) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled':
        return 'from-blue-500 to-cyan-500';
      case 'completed':
        return 'from-green-500 to-emerald-500';
      case 'cancelled':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Use expanded recurring events for display
  const expandedSchedules = expandRecurringEvents(filteredSchedules);
  const calendarEvents = expandedSchedules.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.start_time,
    end: s.end_time,
    extendedProps: s,
  }));

  // Modal handlers
  const handleNewSchedule = () => {
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };
  const handleEventClick = (event: Schedule) => {
    setSelectedEvent(event);
    setModalMode('edit');
    setModalOpen(true);
  };
  const handleCalendarEventClick = (info: any) => {
    const event = schedules.find(s => s.id === info.event.id);
    if (event) handleEventClick(event);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };
  const handleModalSave = async (eventData: any) => {
    try {
      let response;
      if (modalMode === 'create') {
        response = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else if (modalMode === 'edit' && selectedEvent) {
        response = await fetch('/api/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...eventData, id: selectedEvent.id }),
        });
      }
      if (response && response.ok) {
        const updated = await response.json();
        setModalOpen(false);
        // Refresh schedules
        const refetch = await fetch('/api/schedules');
        const data = await refetch.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // Optionally show error toast
    }
  };
  const handleModalDelete = async (id: string) => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setModalOpen(false);
        // Refresh schedules
        const refetch = await fetch('/api/schedules');
        const data = await refetch.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // Optionally show error toast
    }
  };

  // Drag-and-drop handlers
  const handleCalendarEventDrop = async (info: any) => {
    const event = schedules.find(s => s.id === info.event.id);
    if (!event) return;
    try {
      const response = await fetch('/api/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          start_time: info.event.startStr,
          end_time: info.event.endStr || info.event.startStr,
        }),
      });
      if (response.ok) {
        // Refresh schedules
        const refetch = await fetch('/api/schedules');
        const data = await refetch.json();
        setSchedules(Array.isArray(data) ? data : []);
      } else {
        info.revert(); // revert drag if update fails
      }
    } catch (err) {
      info.revert();
    }
  };

  return (
    <div className="space-y-6">
      <ScheduleEventModal
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        event={selectedEvent}
        mode={modalMode}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Schedules</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" /> List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </Button>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white" onClick={handleNewSchedule}>
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 text-red-500">
            <Trash2 className="w-4 h-4" /> Bulk Delete
          </Button>
        </div>
      </div>
      {/* Main Content */}
      {viewMode === 'list' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-4">
            <p className="text-red-500 dark:text-red-400">Error loading schedules: {error}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar">
            <AnimatePresence>
              {expandedSchedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleEventClick(schedule)}
                  className="cursor-pointer"
                >
                  <Card className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(schedule.type)}
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {schedule.title}
                              </h3>
                            </div>
                            <span className={`bg-gradient-to-r ${getStatusColor(schedule.status)} text-white text-xs px-2 py-1 rounded-full`}>
                              {schedule.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {schedule.description}
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <span className="w-4 h-4 mr-2"><CalendarIcon /></span>
                              <p className="text-sm">
                                {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleString()}
                              </p>
                            </div>
                            {schedule.location && (
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <MapPin className="w-4 h-4 mr-2" />
                                <p className="text-sm">{schedule.location}</p>
                              </div>
                            )}
                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <Users className="w-4 h-4 mr-2" />
                              <p className="text-sm">
                                {schedule.participants.length} Participant{schedule.participants.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        <div className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 rounded-lg shadow-lg p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            events={calendarEvents}
            editable={true}
            selectable={true}
            height="auto"
            eventClick={handleCalendarEventClick}
            eventDrop={handleCalendarEventDrop}
            eventResize={handleCalendarEventDrop}
            dayMaxEvents={3}
            eventClassNames={() => 'rounded-lg shadow-md border-none'}
          />
        </div>
      )}
    </div>
  );
}

export function SchedulesTab({ shouldFetch }: { shouldFetch: boolean }) {
  return (
    <CRMErrorBoundary>
      <SchedulesTabContent shouldFetch={shouldFetch} />
    </CRMErrorBoundary>
  );
}

// Add custom scrollbar styles (can be moved to global CSS)
// .custom-scrollbar::-webkit-scrollbar { width: 8px; background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #a0aec0; border-radius: 8px; } 