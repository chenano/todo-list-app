/**
 * Lazy-loaded components for better bundle splitting and performance
 */

import { lazy } from 'react';

// Task management components
export const LazyTaskForm = lazy(() => 
  import('../tasks/TaskForm').then(module => ({ default: module.TaskForm }))
);

export const LazyTaskEditDialog = lazy(() => 
  import('../tasks/TaskEditDialog').then(module => ({ default: module.TaskEditDialog }))
);

export const LazyBulkActionBar = lazy(() => 
  import('../tasks/BulkActionBar').then(module => ({ default: module.BulkActionBar }))
);

// Search components
export const LazySearchDialog = lazy(() => 
  import('../ui/search-dialog').then(module => ({ default: module.SearchDialog }))
);

export const LazySearchResults = lazy(() => 
  import('../ui/search-results').then(module => ({ default: module.SearchResults }))
);

// Export/Import components
export const LazyExportDialog = lazy(() => 
  import('../ui/export-dialog').then(module => ({ default: module.ExportDialog }))
);

export const LazyImportDialog = lazy(() => 
  import('../ui/import-dialog').then(module => ({ default: module.ImportDialog }))
);

// Analytics components
export const LazyAnalyticsDashboard = lazy(() => 
  import('../analytics/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard }))
);

// Calendar and date picker components
export const LazyDatePicker = lazy(() => 
  import('../ui/date-picker').then(module => ({ default: module.DatePicker }))
);

// Rich text editor (if implemented)
export const LazyRichTextEditor = lazy(() => 
  import('../ui/rich-text-editor').then(module => ({ default: module.RichTextEditor }))
);

// Virtual scrolling components
export const LazyVirtualTaskList = lazy(() => 
  import('../tasks/VirtualTaskList').then(module => ({ default: module.VirtualTaskList }))
);

export const LazyEnhancedTaskList = lazy(() => 
  import('../tasks/EnhancedTaskList').then(module => ({ default: module.EnhancedTaskList }))
);

// Keyboard shortcuts help
export const LazyKeyboardShortcutHelp = lazy(() => 
  import('../ui/keyboard-shortcut-help').then(module => ({ default: module.KeyboardShortcutHelp }))
);

// Conflict resolution dialog
export const LazyConflictResolutionDialog = lazy(() => 
  import('../ui/conflict-resolution-dialog').then(module => ({ default: module.ConflictResolutionDialog }))
);

// Sync progress component
export const LazySyncProgress = lazy(() => 
  import('../ui/sync-progress').then(module => ({ default: module.SyncProgress }))
);