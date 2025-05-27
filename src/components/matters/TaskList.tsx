import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Task, TaskStatus } from '@/types/matter';

interface TaskListProps {
  matterId: string;
}

export function TaskList({ matterId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    label: '',
    stage: 'Active Work',
    weight: 1,
    status: 'Not Started' as TaskStatus
  });

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

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/matters/${matterId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completed ? 'Completed' : 'Not Started'
        })
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: completed ? 'Completed' : 'Not Started' }
          : task
      ));
      
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
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
        body: JSON.stringify(newTask)
      });

      if (!response.ok) throw new Error('Failed to add task');
      
      const addedTask = await response.json();
      setTasks([...tasks, addedTask]);
      setNewTask({
        label: '',
        stage: 'Active Work',
        weight: 1,
        status: 'Not Started'
      });
      
      toast.success('Task added successfully');
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Error adding task:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New task..."
          value={newTask.label}
          onChange={e => setNewTask({ ...newTask, label: e.target.value })}
        />
        <Select
          value={newTask.stage}
          onValueChange={value => setNewTask({ ...newTask, stage: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Intake">Intake</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="Active Work">Active Work</SelectItem>
            <SelectItem value="Closure">Closure</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={newTask.weight?.toString()}
          onValueChange={value => setNewTask({ ...newTask, weight: parseInt(value) })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Low (1)</SelectItem>
            <SelectItem value="2">Medium (2)</SelectItem>
            <SelectItem value="3">High (3)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddTask}>Add Task</Button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50">
            <Checkbox
              checked={task.status === 'Completed'}
              onCheckedChange={checked => handleTaskStatusChange(task.id, checked as boolean)}
            />
            <div className="flex-1">
              <p className={`text-sm ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                {task.label}
              </p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{task.stage}</span>
                <span>•</span>
                <span>Weight: {task.weight}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 