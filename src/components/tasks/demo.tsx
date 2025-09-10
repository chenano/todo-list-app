'use client';

import { useState } from 'react';
import { Task } from '@/lib/supabase/types';
import { TaskFormData } from '@/lib/validations';
import { TaskItem, TaskForm, TaskList } from './index';
import { Button } from '@/components/ui/button';

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the new feature',
    completed: false,
    priority: 'high',
    due_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Review pull requests',
    description: null,
    completed: true,
    priority: 'medium',
    due_date: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Update dependencies',
    description: 'Update all npm packages to latest versions',
    completed: false,
    priority: 'low',
    due_date: '2024-11-30',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

export function TaskComponentsDemo() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleToggleComplete = async (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleSubmitTask = async (data: TaskFormData) => {
    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { 
              ...task, 
              title: data.title,
              description: data.description || null,
              priority: data.priority,
              due_date: data.due_date || null,
              updated_at: new Date().toISOString(),
            }
          : task
      ));
    } else {
      // Create new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        list_id: 'list-1',
        user_id: 'user-1',
        title: data.title,
        description: data.description || null,
        completed: false,
        priority: data.priority,
        due_date: data.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
    }
    
    setEditingTask(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Components Demo</h1>
        <Button onClick={() => setShowForm(true)}>
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Task List</h2>
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        {/* Individual Task Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Individual Task Items</h2>
          <div className="space-y-3">
            {tasks.slice(0, 2).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Task Form */}
      <TaskForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmitTask}
        task={editingTask}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        description={editingTask ? 'Update the task details.' : 'Fill in the details to create a new task.'}
      />
    </div>
  );
}

export default TaskComponentsDemo;