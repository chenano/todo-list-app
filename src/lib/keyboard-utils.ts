import { ModifierKey, KeyboardShortcut, FocusableElement } from '@/types/keyboard';

/**
 * Check if a keyboard event matches a shortcut definition
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  // Check if the key matches (case insensitive)
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const requiredModifiers = new Set(shortcut.modifiers);
  const pressedModifiers = new Set<ModifierKey>();

  if (event.ctrlKey) pressedModifiers.add('ctrl');
  if (event.altKey) pressedModifiers.add('alt');
  if (event.shiftKey) pressedModifiers.add('shift');
  if (event.metaKey) pressedModifiers.add('meta');

  // Check if all required modifiers are pressed
  const requiredArray = Array.from(requiredModifiers);
  for (const modifier of requiredArray) {
    if (!pressedModifiers.has(modifier)) {
      return false;
    }
  }

  // Check if any extra modifiers are pressed
  const pressedArray = Array.from(pressedModifiers);
  for (const modifier of pressedArray) {
    if (!requiredModifiers.has(modifier)) {
      return false;
    }
  }

  return true;
}

/**
 * Format a shortcut for display (e.g., "Ctrl+N", "Alt+Shift+D")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Add modifiers in a consistent order
  if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl');
  if (shortcut.modifiers.includes('alt')) parts.push('Alt');
  if (shortcut.modifiers.includes('shift')) parts.push('Shift');
  if (shortcut.modifiers.includes('meta')) parts.push('Cmd');

  // Add the main key with special handling for space
  const key = shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase();
  parts.push(key);

  return parts.join('+');
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: Element): element is FocusableElement {
  if (!(element instanceof HTMLElement)) return false;

  // Check if element is disabled
  if ('disabled' in element && element.disabled) return false;

  // Check if element is hidden
  if (element.style.display === 'none' || element.style.visibility === 'hidden') {
    return false;
  }

  // Check if element has tabindex
  if (element.tabIndex >= 0) return true;

  // Check for naturally focusable elements
  const focusableSelectors = [
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'a[href]',
    '[contenteditable="true"]',
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element = document.body): FocusableElement[] {
  const elements = Array.from(container.querySelectorAll('*'));
  return elements.filter(isFocusable);
}

/**
 * Get the next focusable element in tab order
 */
export function getNextFocusableElement(
  current: FocusableElement,
  elements: FocusableElement[]
): FocusableElement | null {
  const currentIndex = elements.indexOf(current);
  if (currentIndex === -1) return elements[0] || null;
  
  const nextIndex = (currentIndex + 1) % elements.length;
  return elements[nextIndex] || null;
}

/**
 * Get the previous focusable element in tab order
 */
export function getPreviousFocusableElement(
  current: FocusableElement,
  elements: FocusableElement[]
): FocusableElement | null {
  const currentIndex = elements.indexOf(current);
  if (currentIndex === -1) return elements[elements.length - 1] || null;
  
  const prevIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
  return elements[prevIndex] || null;
}

/**
 * Check if the current target should ignore keyboard shortcuts
 */
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  if (!target) return false;

  // Ignore shortcuts when typing in input fields
  const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (inputTypes.includes(target.tagName)) {
    return true;
  }

  // Ignore shortcuts in contenteditable elements
  if (target.contentEditable === 'true') {
    return true;
  }

  // Ignore shortcuts when a modal or dialog is open (check for aria-modal)
  const modal = document.querySelector('[aria-modal="true"]');
  if (modal && !modal.contains(target)) {
    return true;
  }

  return false;
}

/**
 * Create a keyboard shortcut string for display
 */
export function createShortcutString(key: string, modifiers: ModifierKey[]): string {
  return formatShortcut({
    id: '',
    key,
    modifiers,
    context: 'global',
    description: '',
    action: () => {},
  });
}

/**
 * Check if we're on macOS (for Cmd vs Ctrl display)
 */
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Get the primary modifier key for the current platform
 */
export function getPrimaryModifier(): ModifierKey {
  return isMacOS() ? 'meta' : 'ctrl';
}