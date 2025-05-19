import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Calendar as CalendarIcon, Users, MapPin, Clock, Repeat, Bell, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScheduleEventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  onDelete?: (id: string) => void;
  event?: any;
  mode?: 'view' | 'edit' | 'create';
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
];

export function ScheduleEventModal({ open, onClose, onSave, onDelete, event, mode = 'view' }: ScheduleEventModalProps) {
  const [form, setForm] = useState({
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
    }
  }, [event, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSave = () => {
    onSave({
      ...form,
      participants: form.participants.split(',').map((p) => p.trim()).filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-gray-50/80 dark:bg-[#1a2540]/90 rounded-xl shadow-xl p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="p-6 border-b border-gray-200/20 dark:border-gray-800/20">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              <CalendarIcon className="w-6 h-6 text-blue-500" />
              {mode === 'create' ? 'New Schedule' : mode === 'edit' ? 'Edit Schedule' : 'Schedule Details'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => { e.preventDefault(); handleSave(); }}
            className="p-6 space-y-4"
          >
            <Input name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            <div className="flex gap-4">
              <Select value={form.type} onValueChange={v => handleSelect('type', v)}>
                <SelectTrigger className="w-full bg-gray-50/70 dark:bg-[#1a2540]/70">
                  <SelectValue>{typeOptions.find(o => o.value === form.type)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={v => handleSelect('status', v)}>
                <SelectTrigger className="w-full bg-gray-50/70 dark:bg-[#1a2540]/70">
                  <SelectValue>{statusOptions.find(o => o.value === form.status)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input name="participants" value={form.participants} onChange={handleChange} placeholder="Participants (comma separated)" className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            <Input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            <div className="flex gap-4">
              <Input type="datetime-local" name="start_time" value={form.start_time} onChange={handleChange} className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
              <Input type="datetime-local" name="end_time" value={form.end_time} onChange={handleChange} className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            </div>
            <div className="flex gap-4">
              <Input name="recurrence" value={form.recurrence} onChange={handleChange} placeholder="Recurrence (e.g. Weekly)" className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
              <Input name="reminder" value={form.reminder} onChange={handleChange} placeholder="Reminder (e.g. 10m before)" className="bg-gray-50/70 dark:bg-[#1a2540]/70" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200/20 dark:border-gray-800/20">
              {mode !== 'create' && onDelete && (
                <Button type="button" variant="destructive" onClick={() => onDelete(event.id)} className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  {mode === 'create' ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 