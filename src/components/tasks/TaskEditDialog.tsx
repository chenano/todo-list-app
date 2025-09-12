'use client';

import { useState } from 'react';
import { TaskForm } from './TaskForm';
import { Task, TaskFormData } from '@/types';

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskData: TaskFormData) => Promise<void>;
}

export function TaskEditDialog({ task, open, onOpenChange, onSave }: TaskEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (taskData: TaskFormData) => {
    setIsLoading(true);
    try {
      await onSave(taskData);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskForm
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSave}
      task={task}
      loading={isLoading}
      title="Edit Task"
      description="Update the task details below."
    />
  );
}