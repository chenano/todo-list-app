'use client';

import { useKeyboardShortcut, useContextualShortcuts } from '@/hooks/useKeyboardShortcut';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';

interface TaskShortcutsProps {
  taskId?: string;
  onToggleComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onMoveUp?: (taskId: string) => void;
  onMoveDown?: (taskId: string) => void;
}

/**
 * Component that registers task-specific keyboard shortcuts
 */
export function TaskShortcuts({
  taskId,
  onToggleComplete,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TaskShortcutsProps) {
  const { currentContext } = useContextualShortcuts('task');
  const { actions } = useBulkSelection();
  const { toggleTask, selectAll, deselectAll } = actions;

  // Toggle task completion (Space)
  useKeyboardShortcut({
    key: ' ',
    modifiers: [],
    context: 'task',
    description: 'Toggle task completion',
    action: (event) => {
      if (taskId && onToggleComplete) {
        event.preventDefault();
        onToggleComplete(taskId);
      }
    },
    enabled: !!taskId && !!onToggleComplete,
  });

  // Edit task (Enter or E)
  useKeyboardShortcut({
    key: 'Enter',
    modifiers: [],
    context: 'task',
    description: 'Edit task',
    action: (event) => {
      if (taskId && onEdit) {
        event.preventDefault();
        onEdit(taskId);
      }
    },
    enabled: !!taskId && !!onEdit,
  });

  useKeyboardShortcut({
    key: 'e',
    modifiers: [],
    context: 'task',
    description: 'Edit task (alternative)',
    action: (event) => {
      if (taskId && onEdit) {
        event.preventDefault();
        onEdit(taskId);
      }
    },
    enabled: !!taskId && !!onEdit,
  });

  // Delete task (Delete or Backspace)
  useKeyboardShortcut({
    key: 'Delete',
    modifiers: [],
    context: 'task',
    description: 'Delete task',
    action: (event) => {
      if (taskId && onDelete) {
        event.preventDefault();
        onDelete(taskId);
      }
    },
    enabled: !!taskId && !!onDelete,
  });

  useKeyboardShortcut({
    key: 'Backspace',
    modifiers: [],
    context: 'task',
    description: 'Delete task (alternative)',
    action: (event) => {
      if (taskId && onDelete) {
        event.preventDefault();
        onDelete(taskId);
      }
    },
    enabled: !!taskId && !!onDelete,
  });

  // Move task up (Ctrl/Cmd + Up Arrow)
  useKeyboardShortcut({
    key: 'ArrowUp',
    modifiers: ['ctrl'],
    context: 'task',
    description: 'Move task up',
    action: (event) => {
      if (taskId && onMoveUp) {
        event.preventDefault();
        onMoveUp(taskId);
      }
    },
    enabled: !!taskId && !!onMoveUp,
  });

  // Move task down (Ctrl/Cmd + Down Arrow)
  useKeyboardShortcut({
    key: 'ArrowDown',
    modifiers: ['ctrl'],
    context: 'task',
    description: 'Move task down',
    action: (event) => {
      if (taskId && onMoveDown) {
        event.preventDefault();
        onMoveDown(taskId);
      }
    },
    enabled: !!taskId && !!onMoveDown,
  });

  // Bulk selection shortcuts
  useKeyboardShortcut({
    key: 'x',
    modifiers: [],
    context: 'task',
    description: 'Toggle task selection',
    action: (event) => {
      if (taskId) {
        event.preventDefault();
        toggleTask(taskId);
      }
    },
    enabled: !!taskId,
  });

  useKeyboardShortcut({
    key: 'a',
    modifiers: ['ctrl'],
    context: 'task',
    description: 'Select all tasks',
    action: (event) => {
      event.preventDefault();
      // selectAll needs taskIds parameter - this would need to be passed from parent component
      // For now, we'll skip this functionality in keyboard shortcuts
      console.log('Select all shortcut pressed - needs task IDs');
    },
  });

  useKeyboardShortcut({
    key: 'a',
    modifiers: ['ctrl', 'shift'],
    context: 'task',
    description: 'Clear all selections',
    action: (event) => {
      event.preventDefault();
      deselectAll();
    },
  });

  return null; // This component doesn't render anything
}