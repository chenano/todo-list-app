'use client';

import React from 'react';
import { useKeyboardShortcut, useContextualShortcuts } from '@/hooks/useKeyboardShortcut';
import { getPrimaryModifier } from '@/lib/keyboard-utils';

interface FormShortcutsProps {
  onSave?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  canSave?: boolean;
  canCancel?: boolean;
}

/**
 * Component that registers form-specific keyboard shortcuts
 */
export function FormShortcuts({
  onSave,
  onCancel,
  onSubmit,
  canSave = true,
  canCancel = true,
}: FormShortcutsProps) {
  const { currentContext } = useContextualShortcuts('form');
  const primaryModifier = getPrimaryModifier();

  // Save form (Ctrl/Cmd + S)
  useKeyboardShortcut({
    key: 's',
    modifiers: [primaryModifier],
    context: 'form',
    description: 'Save form',
    action: (event) => {
      if (onSave && canSave) {
        event.preventDefault();
        onSave();
      }
    },
    enabled: !!onSave && canSave,
  });

  // Submit form (Ctrl/Cmd + Enter)
  useKeyboardShortcut({
    key: 'Enter',
    modifiers: [primaryModifier],
    context: 'form',
    description: 'Submit form',
    action: (event) => {
      if (onSubmit) {
        event.preventDefault();
        onSubmit();
      } else if (onSave && canSave) {
        event.preventDefault();
        onSave();
      }
    },
    enabled: !!(onSubmit || (onSave && canSave)),
  });

  // Cancel form (Escape)
  useKeyboardShortcut({
    key: 'Escape',
    modifiers: [],
    context: 'form',
    description: 'Cancel form',
    action: (event) => {
      if (onCancel && canCancel) {
        event.preventDefault();
        onCancel();
      }
    },
    enabled: !!onCancel && canCancel,
  });

  // Listen for global save event
  useKeyboardShortcut({
    key: 'save-global',
    modifiers: [],
    context: 'form',
    description: 'Handle global save event',
    action: () => {
      if (onSave && canSave) {
        onSave();
      }
    },
    enabled: false, // This will be triggered by custom events
  });

  // Listen for global save events
  React.useEffect(() => {
    const handleGlobalSave = () => {
      if (onSave && canSave) {
        onSave();
      }
    };

    window.addEventListener('keyboard-save', handleGlobalSave);
    return () => window.removeEventListener('keyboard-save', handleGlobalSave);
  }, [onSave, canSave]);

  return null; // This component doesn't render anything
}