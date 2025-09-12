'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Task } from '@/types';
import { TaskFormData, taskSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import { DatePicker } from '@/components/ui/date-picker';
import { PrioritySelect } from '@/components/ui/priority-select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormShortcuts } from '@/components/keyboard';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  task,
  loading = false,
  title,
  description,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
    },
  });

  const watchedDueDate = watch('due_date');
  const watchedPriority = watch('priority');

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Editing existing task
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          due_date: task.due_date || '',
        });
      } else {
        // Creating new task
        reset({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
        });
      }
    }
  }, [open, task, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting task form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleKeyboardSave = () => {
    handleSubmit(handleFormSubmit)();
  };

  const handleDateChange = (date: Date | undefined) => {
    setValue('due_date', date ? date.toISOString().split('T')[0] : '');
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setValue('priority', priority);
  };

  const getDialogTitle = () => {
    if (title) return title;
    return task ? 'Edit Task' : 'Create New Task';
  };

  const getDialogDescription = () => {
    if (description) return description;
    return task 
      ? 'Update the task details below.' 
      : 'Fill in the details to create a new task.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {/* Form keyboard shortcuts */}
        {open && (
          <FormShortcuts
            onSave={handleKeyboardSave}
            onCancel={handleCancel}
            canSave={!isSubmitting && !loading}
            canCancel={!isSubmitting}
          />
        )}
        
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title Field */}
          <FormField
            label="Title"
            error={errors.title?.message}
            required
          >
            <Input
              {...register('title')}
              placeholder="Enter task title..."
              disabled={isSubmitting || loading}
            />
          </FormField>

          {/* Description Field */}
          <FormField
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder="Enter task description (optional)..."
              disabled={isSubmitting || loading}
              rows={3}
              className="resize-none"
            />
          </FormField>

          {/* Priority Field */}
          <FormField
            label="Priority"
            error={errors.priority?.message}
            required
          >
            <PrioritySelect
              value={watchedPriority}
              onValueChange={handlePriorityChange}
              disabled={isSubmitting || loading}
              placeholder="Select priority"
            />
          </FormField>

          {/* Due Date Field */}
          <FormField
            label="Due Date"
            error={errors.due_date?.message}
          >
            <DatePicker
              date={watchedDueDate ? new Date(watchedDueDate) : undefined}
              onDateChange={handleDateChange}
              disabled={isSubmitting || loading}
              placeholder="Select due date (optional)"
            />
          </FormField>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="min-w-[100px]"
            >
              {isSubmitting || loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {task ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskForm;