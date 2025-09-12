'use client';

import { useRouter } from 'next/navigation';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutContext';
import { useSearchDialog } from '@/components/ui/search-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { getPrimaryModifier } from '@/lib/keyboard-utils';

/**
 * Component that registers global keyboard shortcuts
 */
export function GlobalShortcuts() {
  const router = useRouter();
  const { toggleHelp } = useKeyboardShortcuts();
  const { openSearch } = useSearchDialog();
  const { toggleTheme } = useTheme();
  const primaryModifier = getPrimaryModifier();

  // Global search shortcut (Ctrl/Cmd + K)
  useKeyboardShortcut({
    key: 'k',
    modifiers: [primaryModifier],
    description: 'Open search',
    action: (event) => {
      event.preventDefault();
      openSearch();
    },
  });

  // Alternative search shortcut (Ctrl/Cmd + /)
  useKeyboardShortcut({
    key: '/',
    modifiers: [primaryModifier],
    description: 'Open search (alternative)',
    action: (event) => {
      event.preventDefault();
      openSearch();
    },
  });

  // New task shortcut (Ctrl/Cmd + N)
  useKeyboardShortcut({
    key: 'n',
    modifiers: [primaryModifier],
    description: 'Create new task',
    action: (event) => {
      event.preventDefault();
      // This will be handled by the specific page components
      const newTaskEvent = new CustomEvent('keyboard-new-task');
      window.dispatchEvent(newTaskEvent);
    },
  });

  // Save shortcut (Ctrl/Cmd + S)
  useKeyboardShortcut({
    key: 's',
    modifiers: [primaryModifier],
    description: 'Save current form',
    action: (event) => {
      event.preventDefault();
      // This will be handled by form components
      const saveEvent = new CustomEvent('keyboard-save');
      window.dispatchEvent(saveEvent);
    },
  });

  // Toggle theme shortcut (Ctrl/Cmd + Shift + T)
  useKeyboardShortcut({
    key: 't',
    modifiers: [primaryModifier, 'shift'],
    description: 'Toggle theme',
    action: (event) => {
      event.preventDefault();
      toggleTheme();
    },
  });

  // Help shortcut (F1)
  useKeyboardShortcut({
    key: 'F1',
    modifiers: [],
    description: 'Show keyboard shortcuts help',
    action: (event) => {
      event.preventDefault();
      toggleHelp();
    },
  });

  // Help shortcut alternative (?)
  useKeyboardShortcut({
    key: '?',
    modifiers: [],
    description: 'Show keyboard shortcuts help (alternative)',
    action: (event) => {
      event.preventDefault();
      toggleHelp();
    },
  });

  // Navigation shortcuts (Ctrl/Cmd + 1-9)
  for (let i = 1; i <= 9; i++) {
    useKeyboardShortcut({
      key: i.toString(),
      modifiers: [primaryModifier],
      description: `Navigate to list ${i}`,
      action: (event) => {
        event.preventDefault();
        const navEvent = new CustomEvent('keyboard-navigate-list', {
          detail: { listIndex: i - 1 }
        });
        window.dispatchEvent(navEvent);
      },
    });
  }

  // Dashboard shortcut (Ctrl/Cmd + H)
  useKeyboardShortcut({
    key: 'h',
    modifiers: [primaryModifier],
    description: 'Go to dashboard',
    action: (event) => {
      event.preventDefault();
      router.push('/dashboard');
    },
  });

  // Refresh shortcut (F5 or Ctrl/Cmd + R)
  useKeyboardShortcut({
    key: 'F5',
    modifiers: [],
    description: 'Refresh page',
    action: (event) => {
      event.preventDefault();
      window.location.reload();
    },
  });

  useKeyboardShortcut({
    key: 'r',
    modifiers: [primaryModifier],
    description: 'Refresh page (alternative)',
    action: (event) => {
      event.preventDefault();
      window.location.reload();
    },
  });

  return null; // This component doesn't render anything
}