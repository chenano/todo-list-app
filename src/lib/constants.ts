// Application constants

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const PRIORITY_OPTIONS = [
  { value: PRIORITY_LEVELS.LOW, label: 'Low', color: 'green' },
  { value: PRIORITY_LEVELS.MEDIUM, label: 'Medium', color: 'yellow' },
  { value: PRIORITY_LEVELS.HIGH, label: 'High', color: 'red' },
] as const;

// Task status options
export const TASK_STATUS = {
  ALL: 'all',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
} as const;

export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.ALL, label: 'All Tasks' },
  { value: TASK_STATUS.COMPLETED, label: 'Completed' },
  { value: TASK_STATUS.INCOMPLETE, label: 'Incomplete' },
] as const;

// Sort options
export const SORT_FIELDS = {
  CREATED_AT: 'created_at',
  DUE_DATE: 'due_date',
  PRIORITY: 'priority',
  TITLE: 'title',
} as const;

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const SORT_OPTIONS = [
  { value: SORT_FIELDS.CREATED_AT, label: 'Date Created' },
  { value: SORT_FIELDS.DUE_DATE, label: 'Due Date' },
  { value: SORT_FIELDS.PRIORITY, label: 'Priority' },
  { value: SORT_FIELDS.TITLE, label: 'Title' },
] as const;

// Form validation limits
export const VALIDATION_LIMITS = {
  LIST_NAME_MAX: 100,
  LIST_DESCRIPTION_MAX: 500,
  TASK_TITLE_MAX: 200,
  TASK_DESCRIPTION_MAX: 1000,
  PASSWORD_MIN: 8,
} as const;

// UI constants
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  MAX_ITEMS_PER_PAGE: 50,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'todo-app-theme',
  SIDEBAR_COLLAPSED: 'todo-app-sidebar-collapsed',
  TASK_FILTERS: 'todo-app-task-filters',
  TASK_SORT: 'todo-app-task-sort',
} as const;

// API endpoints (relative to Supabase base URL)
export const API_ENDPOINTS = {
  LISTS: '/rest/v1/lists',
  TASKS: '/rest/v1/tasks',
  AUTH: '/auth/v1',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  LIST_NOT_FOUND: 'List not found.',
  TASK_NOT_FOUND: 'Task not found.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LIST_CREATED: 'List created successfully!',
  LIST_UPDATED: 'List updated successfully!',
  LIST_DELETED: 'List deleted successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  TASK_DELETED: 'Task deleted successfully!',
  TASK_COMPLETED: 'Task marked as complete!',
  TASK_UNCOMPLETED: 'Task marked as incomplete!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Welcome back!',
} as const;

// Default values
export const DEFAULT_VALUES = {
  TASK_PRIORITY: PRIORITY_LEVELS.MEDIUM,
  TASK_STATUS_FILTER: TASK_STATUS.ALL,
  TASK_SORT_FIELD: SORT_FIELDS.CREATED_AT,
  TASK_SORT_DIRECTION: SORT_DIRECTIONS.DESC,
  LIST_DESCRIPTION: '',
  TASK_DESCRIPTION: '',
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'EEEE, MMMM dd, yyyy',
  SHORT: 'MMM dd',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  SAVE: 1000,
  RESIZE: 100,
} as const;

// Database configuration
export const DATABASE_CONFIG = {
  TABLES: {
    LISTS: 'lists',
    TASKS: 'tasks',
  },
  POLICIES: {
    LISTS: {
      SELECT: 'Users can view their own lists',
      INSERT: 'Users can create their own lists',
      UPDATE: 'Users can update their own lists',
      DELETE: 'Users can delete their own lists',
    },
    TASKS: {
      SELECT: 'Users can view their own tasks',
      INSERT: 'Users can create their own tasks',
      UPDATE: 'Users can update their own tasks',
      DELETE: 'Users can delete their own tasks',
    },
  },
  INDEXES: {
    LISTS_USER_ID: 'idx_lists_user_id',
    LISTS_CREATED_AT: 'idx_lists_created_at',
    TASKS_LIST_ID: 'idx_tasks_list_id',
    TASKS_USER_ID: 'idx_tasks_user_id',
    TASKS_DUE_DATE: 'idx_tasks_due_date',
    TASKS_PRIORITY: 'idx_tasks_priority',
    TASKS_COMPLETED: 'idx_tasks_completed',
    TASKS_CREATED_AT: 'idx_tasks_created_at',
  },
} as const;

// Real-time subscription channels
export const REALTIME_CHANNELS = {
  LISTS: 'lists_changes',
  TASKS: 'tasks_changes',
} as const;

// Query limits and pagination
export const QUERY_LIMITS = {
  LISTS_PER_USER: 50,
  TASKS_PER_LIST: 1000,
  TASKS_PER_PAGE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
} as const;

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;