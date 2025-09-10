import { z } from 'zod';

// Authentication validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// List validation schemas
export const listSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(100, 'List name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// Task validation schemas
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Priority is required',
  }),
  due_date: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      {
        message: 'Please enter a valid date',
      }
    )
    .refine(
      (date) => {
        if (!date) return true;
        const parsedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return parsedDate >= today;
      },
      {
        message: 'Due date cannot be in the past',
      }
    ),
});

// Filter validation schemas
export const taskFiltersSchema = z.object({
  status: z.enum(['all', 'completed', 'incomplete']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'all']).optional(),
  overdue: z.boolean().optional(),
});

export const taskSortSchema = z.object({
  field: z.enum(['created_at', 'due_date', 'priority', 'title']),
  direction: z.enum(['asc', 'desc']),
});

// Database entity validation schemas (for API responses)
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const listEntitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  task_count: z.number().optional(),
});

export const taskEntitySchema = z.object({
  id: z.string().uuid(),
  list_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type ListFormData = z.infer<typeof listSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type TaskSort = z.infer<typeof taskSortSchema>;

// Update schemas for partial updates
export const listUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(100, 'List name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
    .optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z
    .string()
    .nullable()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      },
      {
        message: 'Please enter a valid date',
      }
    ),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Database ID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

// API response validation
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
    success: z.boolean(),
  });

// Search and extended filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  list_id: z.string().uuid().optional(),
});

export const extendedTaskFiltersSchema = taskFiltersSchema.extend({
  list_id: z.string().uuid().optional(),
  search: z.string().max(100, 'Search query too long').optional(),
});

// Bulk operation schemas
export const bulkTaskUpdateSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'At least one task must be selected'),
  updates: taskUpdateSchema,
});

export const bulkTaskDeleteSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'At least one task must be selected'),
});

// Import/Export schemas
export const taskImportSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().optional(),
  completed: z.boolean().default(false),
});

export const listImportSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
  tasks: z.array(taskImportSchema).optional(),
});

// Additional type exports
export type ListUpdateData = z.infer<typeof listUpdateSchema>;
export type TaskUpdateData = z.infer<typeof taskUpdateSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type ExtendedTaskFilters = z.infer<typeof extendedTaskFiltersSchema>;
export type BulkTaskUpdate = z.infer<typeof bulkTaskUpdateSchema>;
export type BulkTaskDelete = z.infer<typeof bulkTaskDeleteSchema>;
export type TaskImport = z.infer<typeof taskImportSchema>;
export type ListImport = z.infer<typeof listImportSchema>;