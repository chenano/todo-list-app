export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

export type ShortcutContext = 'global' | 'list' | 'task' | 'form' | 'modal';

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ModifierKey[];
  context: ShortcutContext;
  description: string;
  action: (event: globalThis.KeyboardEvent, context?: any) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export interface ShortcutGroup {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
}

export interface CustomKeyboardEvent extends Event {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface FocusableElement extends HTMLElement {
  focus: () => void;
  blur: () => void;
  tabIndex: number;
}

export interface FocusManager {
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  getCurrentFocus: () => FocusableElement | null;
  setFocusableElements: (elements: FocusableElement[]) => void;
}