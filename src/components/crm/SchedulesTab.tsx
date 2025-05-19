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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { format } from 'date-fns';

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

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    const matchesType = typeFilter === 'all' || schedule.type === typeFilter;
    const matchesDateRange = (!dateRange.start || new Date(schedule.start_time) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(schedule.end_time) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

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
      setIsLoading(true);
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
        toast.success(modalMode === 'create' ? 'Event created successfully' : 'Event updated successfully');
        // Refresh schedules
        const refetch = await fetch('/api/schedules');
        const data = await refetch.json();
        setSchedules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
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

  const handleBulkAction = async (action: string) => {
    if (selectedEvents.length === 0) return;
    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedEvents.map(id => deleteEvent(id)));
          toast.success('Selected events deleted successfully');
          break;
        case 'complete':
          await Promise.all(selectedEvents.map(id => updateEventStatus(id, 'completed')));
          toast.success('Selected events marked as completed');
          break;
        case 'cancel':
          await Promise.all(selectedEvents.map(id => updateEventStatus(id, 'cancelled')));
          toast.success('Selected events marked as cancelled');
          break;
        default:
          break;
      }
      setSelectedEvents([]);
    } catch (error) {
      toast.error('Failed to perform bulk action');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      setSchedules(schedules.filter(s => s.id !== id));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const updateEventStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSchedules(schedules.map(s => s.id === id ? { ...s, status: status as 'scheduled' | 'completed' | 'cancelled' } : s));
      toast.success(`Event marked as ${status}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (type === 'csv') {
      const csvRows = [
        ['Title', 'Description', 'Type', 'Status', 'Start Time', 'End Time', 'Participants', 'Location'],
        ...schedules.map(s => [
          s.title,
          s.description,
          s.type,
          s.status,
          s.start_time,
          s.end_time,
          s.participants.join('; '),
          s.location || ''
        ])
      ];
      const csvContent = csvRows.map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schedules.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'pdf') {
      // Simple PDF export using window.print()
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Schedules PDF Export</title></head><body>');
        printWindow.document.write('<h1>Schedules</h1>');
        printWindow.document.write('<table border="1" cellpadding="5" cellspacing="0"><thead><tr>');
        printWindow.document.write('<th>Title</th><th>Description</th><th>Type</th><th>Status</th><th>Start Time</th><th>End Time</th><th>Participants</th><th>Location</th>');
        printWindow.document.write('</tr></thead><tbody>');
        schedules.forEach(s => {
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${s.title}</td><td>${s.description}</td><td>${s.type}</td><td>${s.status}</td><td>${format(new Date(s.start_time), 'yyyy-MM-dd HH:mm')}</td><td>${format(new Date(s.end_time), 'yyyy-MM-dd HH:mm')}</td><td>${s.participants.join('; ')}</td><td>${s.location || ''}</td>`);
          printWindow.document.write('</tr>');
        });
        printWindow.document.write('</tbody></table></body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
    setShowExportMenu(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Simulate backend import by updating state
        setSchedules(data);
      } catch (error) {
        console.error('Error importing schedules:', error);
      }
    };
    reader.readAsText(file);
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
        isLoading={isLoading}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-semibold text-black dark:text-white">Schedules</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''} text-black dark:text-white`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" /> List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            className={`flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''} text-black dark:text-white`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </Button>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2 w-full">
        {/* Left: Search, New, Export, Import, Bulk Delete */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white whitespace-nowrap text-black dark:text-white" onClick={handleNewSchedule}>
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
          <div className="relative">
            <Button variant="ghost" className="flex items-center gap-2 text-black dark:text-white" onClick={() => setShowExportMenu(v => !v)}>
              <Download className="w-4 h-4" /> Export
            </Button>
            {showExportMenu && (
              <div className="absolute z-10 mt-2 right-0 bg-white dark:bg-[#1a2540] border border-gray-200 dark:border-gray-800 rounded shadow-lg">
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#223366] text-black dark:text-white" onClick={() => handleExport('csv')}>Export as CSV</button>
                <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#223366] text-black dark:text-white" onClick={() => handleExport('pdf')}>Export as PDF</button>
              </div>
            )}
          </div>
          <Button variant="ghost" className="flex items-center gap-2 text-black dark:text-white">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="import-file" />
            <label htmlFor="import-file" className="cursor-pointer text-black dark:text-white">Import</label>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 text-red-500 text-black dark:text-red-400">
            <Trash2 className="w-4 h-4" /> Bulk Delete
          </Button>
        </div>
        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white">
              <SelectValue>Filter by Status</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white">
              <SelectValue>Filter by Type</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {/* Date Range Picker */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-[140px] bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white cursor-pointer"
              placeholder="Start date"
              autoComplete="off"
            />
            <span className="mx-1 text-gray-400">–</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-[140px] bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white cursor-pointer"
              placeholder="End date"
              autoComplete="off"
            />
          </div>
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
                              <h3 className="text-xl font-semibold text-black dark:text-white">
                                {schedule.title}
                              </h3>
                            </div>
                            <span className={`bg-gradient-to-r ${getStatusColor(schedule.status)} text-white text-xs px-2 py-1 rounded-full`}>
                              {schedule.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
                            {schedule.description}
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 dark:text-gray-200">
                              <span className="w-4 h-4 mr-2"><CalendarIcon /></span>
                              <p className="text-sm">
                                {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleString()}
                              </p>
                            </div>
                            {schedule.location && (
                              <div className="flex items-center text-gray-600 dark:text-gray-200">
                                <MapPin className="w-4 h-4 mr-2" />
                                <p className="text-sm">{schedule.location}</p>
                              </div>
                            )}
                            <div className="flex items-center text-gray-600 dark:text-gray-200">
                              <Users className="w-4 h-4 mr-2" />
                              <p className="text-sm">
                                {schedule.participants.length} Participant{schedule.participants.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedEvents.includes(schedule.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEvents([...selectedEvents, schedule.id]);
                              } else {
                                setSelectedEvents(selectedEvents.filter(id => id !== schedule.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{schedule.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-200">{schedule.description}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {selectedEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2"
              >
                <Select onValueChange={handleBulkAction} disabled={isLoading}>
                  <SelectTrigger className="w-full bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border-gray-200/20 dark:border-gray-800/20 dark:placeholder:text-gray-300 text-black dark:text-white">
                    <SelectValue>Bulk Actions</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="complete">Mark as Completed</SelectItem>
                    <SelectItem value="cancel">Mark as Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 rounded-lg shadow-lg p-4"
        >
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
            eventClassNames={() => 'rounded-lg shadow-md border-none text-black dark:text-white'}
          />
        </motion.div>
      )}
      <style jsx global>{`
        html.dark .fc {
          color: #fff !important;
        }
        html.dark .fc .fc-toolbar-title,
        html.dark .fc .fc-col-header-cell-cushion,
        html.dark .fc .fc-daygrid-day-number,
        html.dark .fc .fc-button,
        html.dark .fc .fc-button-primary {
          color: #fff !important;
          border-color: #fff !important;
        }
        html.dark .fc .fc-button-primary {
          background: #223366 !important;
          border-color: #fff !important;
        }
        html.dark .fc .fc-daygrid-day {
          border-color: #fff !important;
        }
        html.dark .fc .fc-scrollgrid {
          border-color: #fff !important;
        }
        html.dark .fc .fc-daygrid-day-frame {
          background: rgba(255,255,255,0.02) !important;
        }
        /* Days of week: light golden blue in light mode, black in dark mode */
        .fc .fc-col-header-cell-cushion {
          color: #60a5fa !important;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        html.dark .fc .fc-col-header-cell-cushion {
          color: #000 !important;
        }
      `}</style>
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