import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: any) => Promise<void>;
  stage: string;
  matterId: string;
  matterTitle: string;
  matterLink: string;
  prefillTaskName: string;
}

interface TaskData {
  label: string;
  description: string;
  priority: string;
  estimatedHours: string;
  dueDate: Date | null;
  assignedTo: string;
  participants: string[];
  stage: string;
  status: string;
  weight: number;
  matter_id: string;
  matter_title: string;
  matter_link: string;
  calendar?: {
    start_time: string;
    end_time: string;
    location: string;
    reminder: string;
    reminder_time: string;
    reminder_type: string[];
  };
}

export function TaskForm({ open, onClose, onSave, stage, matterId, matterTitle, matterLink, prefillTaskName }: TaskFormProps) {
  const [form, setForm] = useState({
    label: prefillTaskName,
    description: '',
    priority: 'medium',
    estimatedHours: '',
    dueDate: null as Date | null,
    assignedTo: '',
    participants: [] as string[],
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDetails, setCalendarDetails] = useState({
    startTime: null as Date | null,
    endTime: null as Date | null,
    location: '',
    reminder: 'none',
    reminderTime: '',
    reminderType: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'high', label: 'High', color: 'text-red-500' },
  ];

  const reminderOptions = [
    { value: 'none', label: 'None' },
    { value: '5m', label: '5 minutes before' },
    { value: '15m', label: '15 minutes before' },
    { value: '30m', label: '30 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '1d', label: '1 day before' },
  ];

  const notificationTypes = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push Notification' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalendarDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData: TaskData = {
        ...form,
        stage,
        status: 'Not Started',
        weight: 1,
        matter_id: matterId,
        matter_title: matterTitle,
        matter_link: matterLink,
      };

      if (showCalendar && calendarDetails.startTime && calendarDetails.endTime) {
        taskData.calendar = {
          start_time: calendarDetails.startTime.toISOString(),
          end_time: calendarDetails.endTime.toISOString(),
          location: calendarDetails.location,
          reminder: calendarDetails.reminder,
          reminder_time: calendarDetails.reminderTime,
          reminder_type: calendarDetails.reminderType,
        };
      }

      await onSave(taskData);
      toast.success('Task created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader className="p-6 border-b border-gray-200/20 dark:border-gray-800/20">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Task
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Task Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Title
                </Label>
                <Input
                  id="label"
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Enter task title"
                  className="mt-1 bg-white/80 dark:bg-gray-800/80"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter task description"
                  className="mt-1 bg-white/80 dark:bg-gray-800/80"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}
                    required
                  >
                    <SelectTrigger className="mt-1 bg-white/80 dark:bg-gray-800/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className={option.color}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedHours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estimated Hours
                  </Label>
                  <Input
                    id="estimatedHours"
                    name="estimatedHours"
                    type="number"
                    value={form.estimatedHours}
                    onChange={handleChange}
                    placeholder="0.0"
                    className="mt-1 bg-white/80 dark:bg-gray-800/80"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </Label>
                <DatePicker
                  selected={form.dueDate}
                  onChange={(date) => setForm(prev => ({ ...prev, dueDate: date }))}
                  className="w-full mt-1 bg-white/80 dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2"
                  placeholderText="Select due date"
                  minDate={new Date()}
                  required
                />
              </div>
            </div>

            {/* Calendar Integration Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToCalendar"
                checked={showCalendar}
                onCheckedChange={(checked) => setShowCalendar(checked as boolean)}
              />
              <Label htmlFor="addToCalendar" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add to Calendar
              </Label>
            </div>

            {/* Calendar Details Section */}
            <AnimatePresence>
              {showCalendar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start Time
                      </Label>
                      <DatePicker
                        selected={calendarDetails.startTime}
                        onChange={(date) => setCalendarDetails(prev => ({ ...prev, startTime: date }))}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full mt-1 bg-white/80 dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2"
                        placeholderText="Select start time"
                        minDate={new Date()}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        End Time
                      </Label>
                      <DatePicker
                        selected={calendarDetails.endTime}
                        onChange={(date) => setCalendarDetails(prev => ({ ...prev, endTime: date }))}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full mt-1 bg-white/80 dark:bg-gray-800/80 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2"
                        placeholderText="Select end time"
                        minDate={calendarDetails.startTime || new Date()}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={calendarDetails.location}
                      onChange={handleCalendarChange}
                      placeholder="Enter location or meeting link"
                      className="mt-1 bg-white/80 dark:bg-gray-800/80"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reminder
                      </Label>
                      <Select
                        value={calendarDetails.reminder}
                        onValueChange={(value) => setCalendarDetails(prev => ({ ...prev, reminder: value }))}
                        required
                      >
                        <SelectTrigger className="mt-1 bg-white/80 dark:bg-gray-800/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reminderOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notification Methods
                      </Label>
                      <div className="mt-2 space-y-2">
                        {notificationTypes.map(type => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={type.value}
                              checked={calendarDetails.reminderType.includes(type.value)}
                              onCheckedChange={(checked) => {
                                setCalendarDetails(prev => ({
                                  ...prev,
                                  reminderType: checked
                                    ? [...prev.reminderType, type.value]
                                    : prev.reminderType.filter(t => t !== type.value)
                                }));
                              }}
                              required={calendarDetails.reminderType.length === 0}
                            />
                            <Label htmlFor={type.value} className="text-sm text-gray-600 dark:text-gray-400">
                              {type.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200/20 dark:border-gray-800/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 