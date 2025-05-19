import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Calendar as CalendarIcon, Users, MapPin, Clock, Repeat, Bell, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { setHours, setMinutes } from 'date-fns';
import { toast } from 'sonner';

export interface ScheduleEvent {
  id?: string;
  title: string;
  description: string;
  type: 'meeting' | 'call' | 'email' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed' | 'moved_forward' | 'moved_backward';
  participants: string[];
  location: string;
  start_time: string;
  end_time: string;
  recurrence: string;
  reminder: string;
}

interface ScheduleEventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  event?: ScheduleEvent;
  mode?: 'view' | 'edit' | 'create';
  isLoading?: boolean;
}

const typeOptions = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'moved_forward', label: 'Moved Forward' },
  { value: 'moved_backward', label: 'Moved Backward' },
];

const recurrenceOptions = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom...' },
];

const reminderOptions = [
  { value: 'none', label: 'None' },
  { value: '5m', label: '5 minutes before' },
  { value: '10m', label: '10 minutes before' },
  { value: '30m', label: '30 minutes before' },
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' },
  { value: 'custom', label: 'Custom...' },
];

export function ScheduleEventModal({ 
  open, 
  onClose, 
  onSave, 
  onDelete, 
  event, 
  mode = 'view', 
  isLoading = false 
}: ScheduleEventModalProps) {
  const [form, setForm] = useState<Omit<ScheduleEvent, 'participants'> & { participants: string }>({
    title: '',
    description: '',
    type: 'meeting',
    status: 'scheduled',
    participants: '',
    location: '',
    start_time: '',
    end_time: '',
    recurrence: '',
    reminder: '',
  });

  const [recurrenceType, setRecurrenceType] = useState('');
  const [reminderType, setReminderType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'meeting',
        status: event.status || 'scheduled',
        participants: (event.participants || []).join(', '),
        location: event.location || '',
        start_time: event.start_time ? event.start_time.slice(0, 16) : '',
        end_time: event.end_time ? event.end_time.slice(0, 16) : '',
        recurrence: event.recurrence || '',
        reminder: event.reminder || '',
      });
      const rec = event.recurrence || 'none';
      if ([ 'daily','weekly','biweekly','monthly','none' ].includes(rec)) {
        setRecurrenceType(rec);
      } else if (rec) {
        setRecurrenceType('custom');
      } else {
        setRecurrenceType('none');
      }
      const rem = event.reminder || 'none';
      if ([ 'none', '5m', '10m', '30m', '1h', '1d' ].includes(rem)) {
        setReminderType(rem);
      } else if (rem) {
        setReminderType('custom');
      } else {
        setReminderType('none');
      }
      setStartDate(event.start_time ? new Date(event.start_time) : null);
      setEndDate(event.end_time ? new Date(event.end_time) : null);
    } else {
      setForm({
        title: '',
        description: '',
        type: 'meeting',
        status: 'scheduled',
        participants: '',
        location: '',
        start_time: '',
        end_time: '',
        recurrence: '',
        reminder: '',
      });
      setRecurrenceType('none');
      setReminderType('none');
      setStartDate(null);
      setEndDate(null);
    }
  }, [event, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    setForm(f => ({ ...f, start_time: date ? date.toISOString() : '' }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    setForm(f => ({ ...f, end_time: date ? date.toISOString() : '' }));
  };

  const validateForm = (): boolean => {
    const now = new Date();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!startDate) {
      toast.error('Start time is required');
      return false;
    }
    if (!endDate) {
      toast.error('End time is required');
      return false;
    }
    if (startDate < now) {
      toast.error('Start time cannot be in the past');
      return false;
    }
    if (endDate < startDate) {
      toast.error('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const eventData: ScheduleEvent = {
        ...form,
        recurrence: recurrenceType === 'custom' ? form.recurrence : (recurrenceType === 'none' ? '' : recurrenceType),
        reminder: reminderType === 'custom' ? form.reminder : (reminderType === 'none' ? '' : reminderType),
        participants: form.participants.split(',').map((p) => p.trim()).filter(Boolean),
      };
      
      if ((eventData.status === 'cancelled' || eventData.status === 'completed') && event?.id && onDelete) {
        await onDelete(event.id);
        toast.success(`Schedule ${eventData.status} and deleted successfully`);
      } else {
        await onSave(eventData);
        toast.success(mode === 'create' ? 'Schedule created successfully' : 'Schedule updated successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;
    
    try {
      setIsSubmitting(true);
      await onDelete(event.id);
      toast.success('Schedule deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full bg-gradient-to-br from-blue-100 via-blue-50 to-pink-100/80 rounded-xl shadow-xl p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="p-6 border-b border-gray-200/20 dark:border-gray-800/20">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-black dark:text-[#60a5fa]">
              <CalendarIcon className="w-6 h-6 text-blue-500" />
              {mode === 'create' ? 'New Schedule' : mode === 'edit' ? 'Edit Schedule' : 'Schedule Details'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'create' ? 'Create a new schedule event' : 
               mode === 'edit' ? 'Edit the schedule event details' : 
               'View schedule event details'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSave}
            className="p-6 space-y-4"
          >
            <label className="block text-sm font-medium text-black mb-1" htmlFor="title">Title</label>
            <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300" />
            <label className="block text-sm font-medium text-black mb-1" htmlFor="description">Description</label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300" />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="type">Type</label>
                <Select value={form.type} onValueChange={v => handleSelect('type', v)}>
                  <SelectTrigger id="type" className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300">
                    <SelectValue>{typeOptions.find(o => o.value === form.type)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="status">Status</label>
                <Select value={form.status} onValueChange={v => handleSelect('status', v)}>
                  <SelectTrigger id="status" className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300">
                    <SelectValue>{statusOptions.find(o => o.value === form.status)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="block text-sm font-medium text-black mb-1" htmlFor="participants">Participants</label>
            <Input id="participants" name="participants" value={form.participants} onChange={handleChange} placeholder="Participants (comma separated)" className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300" />
            <label className="block text-sm font-medium text-black mb-1" htmlFor="location">Location</label>
            <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Location" className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300" />
            <div className="flex gap-8 justify-center">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="start_time">Start Time</label>
                <DatePicker
                  id="start_time"
                  selected={startDate}
                  onChange={handleStartDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy/MM/dd, h:mm aa"
                  placeholderText="Select start time"
                  className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  popperClassName="react-datepicker-popper"
                  calendarClassName="bg-white dark:bg-[#232f4b] text-black dark:text-white"
                  minDate={new Date()}
                  minTime={startDate && startDate.toDateString() === new Date().toDateString() ? new Date() : setHours(setMinutes(new Date(), 0), 0)}
                  maxTime={setHours(setMinutes(new Date(), 59), 23)}
                />
              </div>
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="end_time">End Time</label>
                <DatePicker
                  id="end_time"
                  selected={endDate}
                  onChange={handleEndDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy/MM/dd, h:mm aa"
                  placeholderText="Select end time"
                  className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  popperClassName="react-datepicker-popper"
                  calendarClassName="bg-white dark:bg-[#232f4b] text-black dark:text-white"
                  minDate={startDate || new Date()}
                  minTime={endDate && startDate && endDate.toDateString() === startDate.toDateString() ? startDate : setHours(setMinutes(new Date(), 0), 0)}
                  maxTime={setHours(setMinutes(new Date(), 59), 23)}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="recurrence">Recurrence</label>
                <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v)}>
                  <SelectTrigger id="recurrence" className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300">
                    <SelectValue>{recurrenceOptions.find(o => o.value === recurrenceType)?.label || 'None'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recurrenceType === 'custom' && (
                  <Input name="recurrence" value={form.recurrence} onChange={handleChange} placeholder="Custom recurrence (e.g. every 2 weeks)" className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300 mt-2" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-1" htmlFor="reminder">Reminder</label>
                <Select value={reminderType} onValueChange={v => setReminderType(v)}>
                  <SelectTrigger id="reminder" className="w-full bg-white/80 text-black placeholder:text-gray-500 border border-gray-300">
                    <SelectValue>{reminderOptions.find(o => o.value === reminderType)?.label || 'None'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reminderType === 'custom' && (
                  <Input name="reminder" value={form.reminder} onChange={handleChange} placeholder="Custom reminder (e.g. 2h before)" className="bg-white/80 text-black placeholder:text-gray-500 border border-gray-300 mt-2" />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200/20 dark:border-gray-800/20">
              {mode !== 'create' && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete} 
                  className="flex items-center gap-2"
                  disabled={isSubmitting || isLoading}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose} 
                  disabled={isSubmitting || isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
        <style jsx global>{`
          .react-datepicker-popper[data-placement^='bottom'] {
            left: auto !important;
            right: 0 !important;
            transform: translateX(-50%) !important;
          }
          .react-datepicker__triangle {
            left: 80% !important;
            right: auto !important;
          }
          html.dark .react-datepicker__month-container,
          html.dark .react-datepicker__header,
          html.dark .react-datepicker__day,
          html.dark .react-datepicker__current-month,
          html.dark .react-datepicker__day-name {
            color: #fff !important;
            background: #232f4b !important;
          }
          html.dark .react-datepicker__time-container,
          html.dark .react-datepicker__time-box,
          html.dark .react-datepicker__time-list,
          html.dark .react-datepicker__time-list-item {
            color: #000 !important;
            background: #fff !important;
          }
          html.dark .react-datepicker__time-container .react-datepicker-time__header {
            color: #fff !important;
            background: #232f4b !important;
          }
          /* Date hover and selected styles - stronger specificity */
          .react-datepicker__day:hover, .react-datepicker__time-list-item:hover {
            background: #93c5fd !important;
            color: #1e3a8a !important;
            border-radius: 0.375rem !important;
            border: 2px solid #60a5fa !important;
            z-index: 2;
          }
          .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
            background: #2563eb !important;
            color: #fff !important;
            border-radius: 0.375rem !important;
            border: 2px solid #60a5fa !important;
            z-index: 3;
          }
          .react-datepicker__time-list-item--selected {
            background: #2563eb !important;
            color: #fff !important;
            border-radius: 0.375rem !important;
            border: 2px solid #60a5fa !important;
            z-index: 3;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
} 