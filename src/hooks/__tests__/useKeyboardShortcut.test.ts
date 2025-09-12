import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcut, useMultipleKeyboardShortcuts, useContextualShortcuts } from '../useKeyboardShortcut';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';
import React from 'react';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the context
const mockRegisterShortcut = jest.fn();
const mockSetContext = jest.fn();
const mockPushContext = jest.fn();
const mockPopContext = jest.fn();

jest.mock('@/contexts/KeyboardShortcutContext', () => ({
  useKeyboardShortcuts: () => ({
    registerShortcut: mockRegisterShortcut,
    setContext: mockSetContext,
    pushContext: mockPushContext,
    popContext: mockPopContext,
    currentContext: 'global',
  }),
  KeyboardShortcutProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisterShortcut.mockReturnValue(() => {});
  });

  it('should register a shortcut on mount', () => {
    const action = jest.fn();
    
    renderHook(() =>
      useKeyboardShortcut({
        key: 'n',
        modifiers: ['ctrl'],
        description: 'New item',
        action,
      })
    );

    expect(mockRegisterShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'n',
        modifiers: ['ctrl'],
        description: 'New item',
        action,
        context: 'global',
      })
    );
  });

  it('should use custom context when provided', () => {
    const action = jest.fn();
    
    renderHook(() =>
      useKeyboardShortcut({
        key: 's',
        modifiers: ['ctrl'],
        context: 'form',
        description: 'Save',
        action,
      })
    );

    expect(mockRegisterShortcut).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'form',
      })
    );
  });

  it('should re-register shortcut when dependencies change', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();
    
    const { rerender } = renderHook(
      ({ action }) =>
        useKeyboardShortcut({
          key: 'n',
          modifiers: ['ctrl'],
          description: 'New item',
          action,
          dependencies: [action],
        }),
      { initialProps: { action: action1 } }
    );

    expect(mockRegisterShortcut).toHaveBeenCalledTimes(1);

    rerender({ action: action2 });

    expect(mockRegisterShortcut).toHaveBeenCalledTimes(2);
  });

  it('should call unregister function on unmount', () => {
    const unregister = jest.fn();
    mockRegisterShortcut.mockReturnValue(unregister);
    
    const { unmount } = renderHook(() =>
      useKeyboardShortcut({
        key: 'n',
        modifiers: ['ctrl'],
        description: 'New item',
        action: jest.fn(),
      })
    );

    unmount();

    expect(unregister).toHaveBeenCalled();
  });
});

describe('useMultipleKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisterShortcut.mockReturnValue(() => {});
  });

  it('should register multiple shortcuts', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();
    
    renderHook(() =>
      useMultipleKeyboardShortcuts({
        shortcuts: [
          {
            key: 'n',
            modifiers: ['ctrl'],
            description: 'New item',
            action: action1,
          },
          {
            key: 's',
            modifiers: ['ctrl'],
            description: 'Save',
            action: action2,
          },
        ],
      })
    );

    expect(mockRegisterShortcut).toHaveBeenCalledTimes(2);
    expect(mockRegisterShortcut).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: 'n',
        action: action1,
      })
    );
    expect(mockRegisterShortcut).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: 's',
        action: action2,
      })
    );
  });

  it('should re-register all shortcuts when shortcuts array changes', () => {
    const shortcuts1 = [
      {
        key: 'n',
        modifiers: ['ctrl'] as const,
        description: 'New item',
        action: jest.fn(),
      },
    ];

    const shortcuts2 = [
      {
        key: 's',
        modifiers: ['ctrl'] as const,
        description: 'Save',
        action: jest.fn(),
      },
    ];

    const { rerender } = renderHook(
      ({ shortcuts }) => useMultipleKeyboardShortcuts({ shortcuts }),
      { initialProps: { shortcuts: shortcuts1 } }
    );

    expect(mockRegisterShortcut).toHaveBeenCalledTimes(1);

    rerender({ shortcuts: shortcuts2 });

    expect(mockRegisterShortcut).toHaveBeenCalledTimes(2);
  });
});

describe('useContextualShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should push context on mount and pop on unmount', () => {
    const { unmount } = renderHook(() => useContextualShortcuts('form'));

    expect(mockPushContext).toHaveBeenCalledWith('form');

    unmount();

    expect(mockPopContext).toHaveBeenCalled();
  });

  it('should return context management functions', () => {
    const { result } = renderHook(() => useContextualShortcuts('form'));

    expect(result.current).toEqual({
      currentContext: 'global',
      setContext: mockSetContext,
      pushContext: mockPushContext,
      popContext: mockPopContext,
    });
  });
});