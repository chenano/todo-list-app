'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { KeyboardShortcut, ShortcutContext, ShortcutGroup, FocusManager, FocusableElement } from '@/types/keyboard';
import { matchesShortcut, shouldIgnoreShortcut, getFocusableElements, getNextFocusableElement, getPreviousFocusableElement } from '@/lib/keyboard-utils';

interface KeyboardShortcutContextType {
  // Shortcut management
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (id: string) => void;
  getShortcuts: (context?: ShortcutContext) => KeyboardShortcut[];
  getShortcutGroups: () => ShortcutGroup[];
  
  // Context management
  currentContext: ShortcutContext;
  setContext: (context: ShortcutContext) => void;
  pushContext: (context: ShortcutContext) => void;
  popContext: () => void;
  
  // Focus management
  focusManager: FocusManager;
  
  // Help system
  showHelp: boolean;
  toggleHelp: () => void;
  setShowHelp: (show: boolean) => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined);

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(new Map());
  const [contextStack, setContextStack] = useState<ShortcutContext[]>(['global']);
  const [showHelp, setShowHelp] = useState(false);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  
  const contextDataRef = useRef<any>({});

  const currentContext = contextStack[contextStack.length - 1];

  // Register a keyboard shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => new Map(prev).set(shortcut.id, shortcut));
    
    // Return unregister function
    return () => {
      setShortcuts(prev => {
        const newMap = new Map(prev);
        newMap.delete(shortcut.id);
        return newMap;
      });
    };
  }, []);

  // Unregister a keyboard shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Get shortcuts for a specific context
  const getShortcuts = useCallback((context?: ShortcutContext) => {
    const targetContext = context || currentContext;
    return Array.from(shortcuts.values()).filter(
      shortcut => shortcut.context === targetContext || shortcut.context === 'global'
    );
  }, [shortcuts, currentContext]);

  // Get shortcuts organized by groups
  const getShortcutGroups = useCallback((): ShortcutGroup[] => {
    const groups: { [key: string]: ShortcutGroup } = {};
    
    Array.from(shortcuts.values()).forEach(shortcut => {
      const groupId = shortcut.context;
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          name: groupId.charAt(0).toUpperCase() + groupId.slice(1),
          shortcuts: [],
        };
      }
      groups[groupId].shortcuts.push(shortcut);
    });

    return Object.values(groups);
  }, [shortcuts]);

  // Context management
  const setContext = useCallback((context: ShortcutContext) => {
    setContextStack([context]);
  }, []);

  const pushContext = useCallback((context: ShortcutContext) => {
    setContextStack(prev => [...prev, context]);
  }, []);

  const popContext = useCallback(() => {
    setContextStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);

  // Focus management
  const focusManager: FocusManager = {
    focusNext: () => {
      const current = document.activeElement as FocusableElement;
      const next = getNextFocusableElement(current, focusableElements);
      if (next) next.focus();
    },
    
    focusPrevious: () => {
      const current = document.activeElement as FocusableElement;
      const previous = getPreviousFocusableElement(current, focusableElements);
      if (previous) previous.focus();
    },
    
    focusFirst: () => {
      const first = focusableElements[0];
      if (first) first.focus();
    },
    
    focusLast: () => {
      const last = focusableElements[focusableElements.length - 1];
      if (last) last.focus();
    },
    
    getCurrentFocus: () => {
      return document.activeElement as FocusableElement;
    },
    
    setFocusableElements: (elements: FocusableElement[]) => {
      setFocusableElements(elements);
    },
  };

  // Help system
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs or when help is shown
    if (shouldIgnoreShortcut(event)) {
      return;
    }

    // Handle help toggle (F1 or ?)
    if (event.key === 'F1' || (event.key === '?' && !event.shiftKey)) {
      event.preventDefault();
      toggleHelp();
      return;
    }

    // Handle escape key - close help or pop context
    if (event.key === 'Escape') {
      if (showHelp) {
        setShowHelp(false);
        event.preventDefault();
        return;
      }
      
      // Pop context if we're not at global level
      if (contextStack.length > 1) {
        popContext();
        event.preventDefault();
        return;
      }
    }

    // Find matching shortcuts for current context
    const activeShortcuts = getShortcuts();
    
    for (const shortcut of activeShortcuts) {
      if (shortcut.enabled !== false && matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        try {
          shortcut.action(event, contextDataRef.current);
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
        
        break; // Only execute the first matching shortcut
      }
    }
  }, [getShortcuts, showHelp, contextStack.length, toggleHelp, popContext]);

  // Set up global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update focusable elements when DOM changes
  useEffect(() => {
    const updateFocusableElements = () => {
      const elements = getFocusableElements();
      setFocusableElements(elements);
    };

    // Initial update
    updateFocusableElements();

    // Update on DOM mutations
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'hidden'],
    });

    return () => observer.disconnect();
  }, []);

  const value: KeyboardShortcutContextType = {
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    getShortcutGroups,
    currentContext,
    setContext,
    pushContext,
    popContext,
    focusManager,
    showHelp,
    toggleHelp,
    setShowHelp,
  };

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutProvider');
  }
  return context;
}