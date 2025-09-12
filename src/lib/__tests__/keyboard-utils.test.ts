import {
  matchesShortcut,
  formatShortcut,
  isFocusable,
  getFocusableElements,
  shouldIgnoreShortcut,
  createShortcutString,
  isMacOS,
  getPrimaryModifier,
} from '../keyboard-utils';
import { KeyboardShortcut } from '@/types/keyboard';

// Mock navigator for testing
Object.defineProperty(window, 'navigator', {
  value: {
    platform: 'MacIntel',
  },
  writable: true,
});

describe('keyboard-utils', () => {
  describe('matchesShortcut', () => {
    const shortcut: KeyboardShortcut = {
      id: 'test',
      key: 'n',
      modifiers: ['ctrl'],
      context: 'global',
      description: 'Test shortcut',
      action: jest.fn(),
    };

    it('should match when key and modifiers are correct', () => {
      const event = {
        key: 'n',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      } as KeyboardEvent;

      expect(matchesShortcut(event, shortcut)).toBe(true);
    });

    it('should not match when key is different', () => {
      const event = {
        key: 'm',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      } as KeyboardEvent;

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should not match when modifiers are different', () => {
      const event = {
        key: 'n',
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        metaKey: false,
      } as KeyboardEvent;

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should not match when extra modifiers are pressed', () => {
      const event = {
        key: 'n',
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
        metaKey: false,
      } as KeyboardEvent;

      expect(matchesShortcut(event, shortcut)).toBe(false);
    });

    it('should match case insensitively', () => {
      const event = {
        key: 'N',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      } as KeyboardEvent;

      expect(matchesShortcut(event, shortcut)).toBe(true);
    });
  });

  describe('formatShortcut', () => {
    it('should format single modifier correctly', () => {
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 'n',
        modifiers: ['ctrl'],
        context: 'global',
        description: 'Test',
        action: jest.fn(),
      };

      expect(formatShortcut(shortcut)).toBe('Ctrl+N');
    });

    it('should format multiple modifiers in correct order', () => {
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 's',
        modifiers: ['ctrl', 'shift', 'alt'],
        context: 'global',
        description: 'Test',
        action: jest.fn(),
      };

      expect(formatShortcut(shortcut)).toBe('Ctrl+Alt+Shift+S');
    });

    it('should format meta key as Cmd', () => {
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 'c',
        modifiers: ['meta'],
        context: 'global',
        description: 'Test',
        action: jest.fn(),
      };

      expect(formatShortcut(shortcut)).toBe('Cmd+C');
    });

    it('should format key without modifiers', () => {
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 'Escape',
        modifiers: [],
        context: 'global',
        description: 'Test',
        action: jest.fn(),
      };

      expect(formatShortcut(shortcut)).toBe('ESCAPE');
    });

    it('should format space key correctly', () => {
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: ' ',
        modifiers: [],
        context: 'global',
        description: 'Test',
        action: jest.fn(),
      };

      expect(formatShortcut(shortcut)).toBe('Space');
    });
  });

  describe('isFocusable', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should return true for button elements', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      expect(isFocusable(button)).toBe(true);
    });

    it('should return true for input elements', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      expect(isFocusable(input)).toBe(true);
    });

    it('should return true for elements with tabindex >= 0', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      expect(isFocusable(div)).toBe(true);
    });

    it('should return false for disabled elements', () => {
      const button = document.createElement('button');
      button.disabled = true;
      document.body.appendChild(button);
      expect(isFocusable(button)).toBe(false);
    });

    it('should return false for hidden elements', () => {
      const button = document.createElement('button');
      button.style.display = 'none';
      document.body.appendChild(button);
      expect(isFocusable(button)).toBe(false);
    });

    it('should return false for elements with negative tabindex', () => {
      const div = document.createElement('div');
      div.tabIndex = -1;
      document.body.appendChild(div);
      expect(isFocusable(div)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should return all focusable elements in container', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const input = document.createElement('input');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(input);
      container.appendChild(disabledButton);
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(3);
      expect(focusable).toContain(button1);
      expect(focusable).toContain(button2);
      expect(focusable).toContain(input);
      expect(focusable).not.toContain(disabledButton);
    });
  });

  describe('shouldIgnoreShortcut', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should return true for input elements', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      
      const event = {
        target: input,
      } as KeyboardEvent;

      expect(shouldIgnoreShortcut(event)).toBe(true);
    });

    it('should return true for textarea elements', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      
      const event = {
        target: textarea,
      } as KeyboardEvent;

      expect(shouldIgnoreShortcut(event)).toBe(true);
    });

    it('should return true for contenteditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      
      const event = {
        target: div,
      } as KeyboardEvent;

      expect(shouldIgnoreShortcut(event)).toBe(true);
    });

    it('should return false for regular elements', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      
      const event = {
        target: button,
      } as KeyboardEvent;

      expect(shouldIgnoreShortcut(event)).toBe(false);
    });

    it('should return true when modal is open and target is outside', () => {
      const modal = document.createElement('div');
      modal.setAttribute('aria-modal', 'true');
      const button = document.createElement('button');
      
      document.body.appendChild(modal);
      document.body.appendChild(button);
      
      const event = {
        target: button,
      } as KeyboardEvent;

      expect(shouldIgnoreShortcut(event)).toBe(true);
    });
  });

  describe('createShortcutString', () => {
    it('should create shortcut string correctly', () => {
      expect(createShortcutString('n', ['ctrl'])).toBe('Ctrl+N');
      expect(createShortcutString('s', ['ctrl', 'shift'])).toBe('Ctrl+Shift+S');
    });
  });

  describe('isMacOS', () => {
    it('should detect macOS correctly', () => {
      // Mock is set to MacIntel in beforeAll
      expect(isMacOS()).toBe(true);
    });

    it('should detect non-macOS correctly', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          platform: 'Win32',
        },
        writable: true,
      });

      expect(isMacOS()).toBe(false);
    });
  });

  describe('getPrimaryModifier', () => {
    it('should return meta for macOS', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          platform: 'MacIntel',
        },
        writable: true,
      });

      expect(getPrimaryModifier()).toBe('meta');
    });

    it('should return ctrl for non-macOS', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          platform: 'Win32',
        },
        writable: true,
      });

      expect(getPrimaryModifier()).toBe('ctrl');
    });
  });
});