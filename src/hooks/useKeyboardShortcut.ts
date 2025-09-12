import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutContext';
import { KeyboardShortcut, ModifierKey, ShortcutContext } from '@/types/keyboard';

interface UseKeyboardShortcutOptions {
  key: string;
  modifiers?: ModifierKey[];
  context?: ShortcutContext;
  description: string;
  action: (event: KeyboardEvent, context?: any) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
  dependencies?: any[];
}

/**
 * Hook for registering a single keyboard shortcut
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions) {
  const { registerShortcut } = useKeyboardShortcuts();
  const unregisterRef = useRef<(() => void) | null>(null);
  const idRef = useRef<string>(`shortcut-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Unregister previous shortcut if it exists
    if (unregisterRef.current) {
      unregisterRef.current();
    }

    // Register new shortcut
    const shortcut: KeyboardShortcut = {
      id: idRef.current,
      key: options.key,
      modifiers: options.modifiers || [],
      context: options.context || 'global',
      description: options.description,
      action: options.action,
      preventDefault: options.preventDefault,
      stopPropagation: options.stopPropagation,
      enabled: options.enabled,
    };

    unregisterRef.current = registerShortcut(shortcut);

    // Cleanup on unmount
    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
      }
    };
  }, [
    registerShortcut,
    options.key,
    JSON.stringify(options.modifiers),
    options.context,
    options.description,
    options.preventDefault,
    options.stopPropagation,
    options.enabled,
    ...(options.dependencies || []),
  ]);
}

interface UseKeyboardShortcutsOptions {
  shortcuts: Omit<UseKeyboardShortcutOptions, 'dependencies'>[];
  dependencies?: any[];
}

/**
 * Hook for registering multiple keyboard shortcuts at once
 */
export function useMultipleKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { registerShortcut } = useKeyboardShortcuts();
  const unregisterFunctionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Unregister all previous shortcuts
    unregisterFunctionsRef.current.forEach(unregister => unregister());
    unregisterFunctionsRef.current = [];

    // Register new shortcuts
    options.shortcuts.forEach((shortcutOptions, index) => {
      const shortcut: KeyboardShortcut = {
        id: `shortcuts-${Math.random().toString(36).substr(2, 9)}-${index}`,
        key: shortcutOptions.key,
        modifiers: shortcutOptions.modifiers || [],
        context: shortcutOptions.context || 'global',
        description: shortcutOptions.description,
        action: shortcutOptions.action,
        preventDefault: shortcutOptions.preventDefault,
        stopPropagation: shortcutOptions.stopPropagation,
        enabled: shortcutOptions.enabled,
      };

      const unregister = registerShortcut(shortcut);
      unregisterFunctionsRef.current.push(unregister);
    });

    // Cleanup on unmount
    return () => {
      unregisterFunctionsRef.current.forEach(unregister => unregister());
    };
  }, [registerShortcut, JSON.stringify(options.shortcuts), ...(options.dependencies || [])]);
}

/**
 * Hook for managing context-aware shortcuts
 */
export function useContextualShortcuts(context: ShortcutContext) {
  const { setContext, pushContext, popContext, currentContext } = useKeyboardShortcuts();

  useEffect(() => {
    pushContext(context);
    return () => {
      popContext();
    };
  }, [context, pushContext, popContext]);

  return {
    currentContext,
    setContext,
    pushContext,
    popContext,
  };
}

/**
 * Hook for focus management within a component
 */
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const { focusManager } = useKeyboardShortcuts();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const element = el as HTMLElement;
      return !(element as any).disabled && element.tabIndex !== -1;
    }) as HTMLElement[];

    focusManager.setFocusableElements(focusableElements);
  }, [containerRef, focusManager]);

  return focusManager;
}