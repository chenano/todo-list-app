// Core TypeScript interfaces for the Todo List application

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  task_count?: number;
}

export interface Task {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: 'all' | 'completed' | 'incomplete';
  priority?: 'low' | 'medium' | 'high' | 'all';
  overdue?: boolean;
}

export interface TaskSort {
  field: 'created_at' | 'due_date' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

// Form input types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ListFormData {
  name: string;
  description?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}

// Database operation types
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ListWithTaskCount extends List {
  task_count: number;
}

export interface TaskWithList extends Task {
  list: Pick<List, 'id' | 'name'>;
}

// Authentication types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

// Utility types
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'completed' | 'incomplete';
export type SortDirection = 'asc' | 'desc';

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// Update form data types
export interface ListUpdateData {
  name?: string;
  description?: string;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

// Extended filter types
export interface ExtendedTaskFilters extends TaskFilters {
  list_id?: string;
  search?: string;
}

// UI State types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface ListUIState extends UIState {
  selectedList: string | null;
  showCreateForm: boolean;
  showEditForm: boolean;
  editingList: List | null;
}

export interface TaskUIState extends UIState {
  selectedTask: string | null;
  showCreateForm: boolean;
  showEditForm: boolean;
  editingTask: Task | null;
  filters: TaskFilters;
  sort: TaskSort;
}

// Search and bulk operation types
export interface SearchParams {
  query?: string;
  list_id?: string;
}

export interface BulkTaskUpdate {
  task_ids: string[];
  updates: TaskUpdateData;
}

export interface BulkTaskDelete {
  task_ids: string[];
}

// Import/Export types
export interface TaskImport {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed: boolean;
}

export interface ListImport {
  name: string;
  description?: string;
  tasks?: TaskImport[];
}

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseFormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>;
  reset: (initialValues?: T) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ErrorDisplayProps extends BaseComponentProps {
  error: Error | string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}