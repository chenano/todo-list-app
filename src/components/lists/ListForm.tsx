'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { List } from '@/lib/supabase/types';
import { ListFormData, listSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ListFormData) => Promise<void>;
  initialData?: Partial<List>;
  isLoading?: boolean;
  title?: string;
  description?: string;
  submitText?: string;
}

export function ListForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
  title = 'Create List',
  description = 'Create a new list to organize your tasks.',
  submitText = 'Create List',
}: ListFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name || '');
      setValue('description', initialData.description || '');
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: ListFormData) => {
    if (isSubmitting || isLoading) return;

    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const nameValue = watch('name');
  const descriptionValue = watch('description');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            label="List Name"
            error={errors.name?.message}
            required
          >
            <Input
              {...register('name')}
              placeholder="Enter list name"
              disabled={isSubmitting || isLoading}
              autoFocus
            />
          </FormField>

          <FormField
            label="Description"
            error={errors.description?.message}
            description="Optional description for your list"
          >
            <Input
              {...register('description')}
              placeholder="Enter description (optional)"
              disabled={isSubmitting || isLoading}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isLoading || !nameValue?.trim()}
            >
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ListForm;