import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/matter';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trash2, Plus, FileText, Briefcase, CheckCircle, CalendarIcon, Pencil, Trash, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScheduleEventModal } from '@/components/crm/ScheduleEventModal';
import { TaskForm } from './TaskForm';

interface TaskListProps {
  matterId: string;
  matterTitle: string;
  matterLink: string;
  hasTemplate?: boolean;
}

interface TaskWithSchedule extends Task {
  schedule_id?: string;
  due_date?: string;
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

export function TaskList({ matterId, matterTitle, matterLink, hasTemplate }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskStage, setAddTaskStage] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [prefillTaskName, setPrefillTaskName] = useState('');
  const [newTask, setNewTask] = useState<Partial<Task>>({
    label: '',
    stage: 'Active Work',
    status: 'Not Started' as TaskStatus
  });
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [sortByDueDate, setSortByDueDate] = useState<boolean>(false);

  useEffect(() => {
    fetchTasks();
  }, [matterId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/matters/${matterId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduleByTask = async (task: TaskWithSchedule) => {
    // Try to delete by schedule_id if present
    if (task.schedule_id) {
      try {
        await fetch(`/api/schedules?id=${task.schedule_id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete linked schedule by schedule_id:', e);
      }
      return;
    }
    // Otherwise, try to find and delete by metadata.task_id
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        const found = (data.data || []).find((s: any) => s.metadata?.task_id === task.id);
        if (found) {
          await fetch(`/api/schedules?id=${found.id}`, { method: 'DELETE' });
        }
      }
    } catch (e) {
      console.error('Failed to find/delete schedule by metadata.task_id:', e);
    }
  };

  const handleTaskStatusChange = async (taskId: string, checked: boolean | 'indeterminate') => {
    console.log('[TaskList] Status change requested:', { taskId, checked });
    
    if (checked === 'indeterminate') {
      console.log('[TaskList] Indeterminate state, ignoring');
      return;
    }
    
    const newStatus = checked ? 'Completed' : 'Not Started';
    console.log('[TaskList] New status will be:', newStatus);
    
    // Optimistically update the UI
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus }
        : task
    ));

    try {
      console.log('[TaskList] Sending PATCH request to update task status');
      const response = await fetch(`/api/matters/${matterId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[TaskList] Server error response:', error);
        throw new Error(error.error || 'Failed to update task');
      }
      
      const updatedTask = await response.json();
      console.log('[TaskList] Server response:', updatedTask);
      
      // Update with server response
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      toast.success(checked ? 'Task completed' : 'Task marked as incomplete');

      if (checked) {
        // If marking as completed, delete the schedule
        const completedTask = tasks.find(task => task.id === taskId);
        if (completedTask) {
          await deleteScheduleByTask(completedTask);
        }
      }
    } catch (error) {
      console.error('[TaskList] Error updating task:', error);
      // Revert optimistic update on error
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: checked ? 'Not Started' : 'Completed' }
          : task
      ));
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Optimistically update the UI
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(tasks.filter(task => task.id !== taskId));

    try {
      const response = await fetch(`/api/matters/${matterId}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }
      
      toast.success('Task deleted successfully');

      // Also delete the schedule if it exists
      if (taskToDelete) {
        await deleteScheduleByTask(taskToDelete);
      }
    } catch (error) {
      // Revert optimistic update on error
      if (taskToDelete) {
        setTasks([...tasks, taskToDelete]);
      }
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.label) {
      toast.error('Task label is required');
      return;
    }

    try {
      const response = await fetch(`/api/matters/${matterId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          weight: 1 // Add default weight
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add task');
      }
      
      const addedTask = await response.json();
      setTasks([...tasks, addedTask]);
      setNewTask({
        label: '',
        stage: 'Active Work',
        status: 'Not Started'
      });
      toast.success('Task added successfully');
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Error adding task:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const taskId = result.draggableId;
    const newStage = destination.droppableId;

    // Optimistically update the UI
    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], stage: newStage };
      setTasks(updatedTasks);
    }

    try {
      const response = await fetch(`/api/matters/${matterId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task stage');
      }

      const updatedTask = await response.json();
      // Update with server response
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));

      toast.success('Task moved successfully');
    } catch (error) {
      // Revert optimistic update on error
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, stage: source.droppableId }
          : task
      ));
      console.error('Error moving task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move task');
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Intake':
        return <FileText className="w-4 h-4 text-pink-400" />;
      case 'Planning':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'Active Work':
        return <Briefcase className="w-4 h-4 text-yellow-400" />;
      case 'Closure':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // Handler to open modal for a specific stage
  const handleOpenAddTaskModal = (stage: string, taskName?: string) => {
    setAddTaskStage(stage);
    setPrefillTaskName(taskName || '');
    setShowTaskForm(true);
  };

  // Handler for task form save
  const handleTaskFormSave = async (taskData: TaskData) => {
    try {
      // Create the task
      const taskRes = await fetch(`/api/matters/${matterId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: taskData.label,
          description: taskData.description,
          stage: taskData.stage,
          status: 'Not Started',
          weight: 1,
          priority: taskData.priority,
          estimated_hours: taskData.estimatedHours,
          due_date: taskData.dueDate?.toISOString(),
          assigned_to: taskData.assignedTo,
          participants: taskData.participants
        })
      });

      if (!taskRes.ok) {
        const err = await taskRes.json();
        throw new Error(err.error || 'Failed to create task');
      }

      const createdTask = await taskRes.json();

      // If calendar details are provided, create the schedule event
      if (taskData.calendar) {
        const scheduleRes = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskData.label,
            description: taskData.description,
            start_time: taskData.calendar.start_time,
            end_time: taskData.calendar.end_time,
            type: 'other',
            status: 'scheduled',
            participants: taskData.participants,
            location: taskData.calendar.location,
            metadata: {
              matter_id: matterId,
              matter_title: matterTitle,
              matter_link: matterLink,
              task_id: createdTask.id
            },
            reminder_time: taskData.calendar.reminder_time || null,
            reminder_type: taskData.calendar.reminder_type
          })
        });
        console.log('[DEBUG][TaskList] Schedule event POST response:', scheduleRes);
        let scheduleData;
        try {
          scheduleData = await scheduleRes.json();
          console.log('[DEBUG][TaskList] Schedule event POST data:', scheduleData);
          if (!scheduleRes.ok) {
            toast.error('Failed to add to calendar: ' + (scheduleData?.error || 'Unknown error'));
            throw new Error(scheduleData?.error || 'Failed to add to calendar');
          }
        } catch (jsonErr) {
          console.error('[DEBUG][TaskList] Failed to parse schedule event POST response as JSON:', jsonErr);
          toast.error('Failed to add to calendar: Invalid server response');
          throw new Error('Failed to add to calendar: Invalid server response');
        }
      }

      toast.success('Task created successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    }
    setShowTaskForm(false);
    setAddTaskStage(null);
  };

  const filterTasksByDueDate = (tasks: TaskWithSchedule[]) => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    return tasks.filter(task => {
      const dueDate = new Date((task as any).due_date);
      switch (dueDateFilter) {
        case 'overdue':
          return dueDate < today;
        case 'dueToday':
          return dueDate.toDateString() === today.toDateString();
        case 'dueThisWeek':
          return dueDate >= today && dueDate <= endOfWeek;
        default:
          return true;
      }
    });
  };

  const sortTasksByDueDate = (tasks: TaskWithSchedule[]) => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date((a as any).due_date);
      const dateB = new Date((b as any).due_date);
      return sortByDueDate ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  };

  const filteredAndSortedTasks = sortTasksByDueDate(filterTasksByDueDate(tasks));

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  if (!hasTemplate && tasks.length === 0) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Get Started with Tasks</h3>
          <p className="text-sm text-gray-500">Choose how you want to manage this matter's tasks</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Custom Tasks
          </Button>
        </div>
      </div>
    );
  }

  const stages = ['Intake', 'Planning', 'Active Work', 'Closure'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by due date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="dueToday">Due Today</SelectItem>
            <SelectItem value="dueThisWeek">Due This Week</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setSortByDueDate(!sortByDueDate)}>
          {sortByDueDate ? 'Sort Oldest First' : 'Sort Newest First'}
        </Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map(stage => (
            <div key={stage} className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg justify-between">
                <div className="flex items-center gap-2">
                  {getStageIcon(stage)}
                  <h3 className="text-sm font-medium">{stage}</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenAddTaskModal(stage)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Droppable droppableId={stage}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[100px] p-2 bg-gray-50 rounded-lg"
                  >
                    {filteredAndSortedTasks
                      .filter(task => task.stage === stage)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group relative flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                                task.status === 'Completed' 
                                  ? 'bg-green-50 border border-green-100' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <Checkbox
                                    checked={task.status === 'Completed'}
                                    onCheckedChange={checked => handleTaskStatusChange(task.id, checked as boolean | 'indeterminate')}
                                    className={`h-5 w-5 rounded-full border-2 transition-all duration-200 ${
                                      task.status === 'Completed'
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 hover:border-green-500'
                                    }`}
                                  />
                                  {task.status === 'Completed' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm transition-all duration-200 ${
                                    task.status === 'Completed' 
                                      ? 'text-green-700 line-through decoration-green-500/50' 
                                      : 'text-gray-700'
                                  }`}>
                                    {task.label}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenAddTaskModal(task.stage, task.label)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl w-full">
          <TaskForm
            open={showTaskForm}
            onClose={() => setShowTaskForm(false)}
            onSave={handleTaskFormSave}
            stage={addTaskStage || 'Active Work'}
            matterId={matterId}
            matterTitle={matterTitle}
            matterLink={matterLink}
            prefillTaskName={prefillTaskName || ''}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 