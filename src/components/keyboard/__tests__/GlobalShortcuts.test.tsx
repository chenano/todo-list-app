import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { GlobalShortcuts } from '../GlobalShortcuts';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock search dialog hook
const mockOpenSearch = jest.fn();
jest.mock('@/components/ui/search-dialog', () => ({
  useSearchDialog: () => ({
    openSearch: mockOpenSearch,
  }),
}));

// Mock theme hook
const mockToggleTheme = jest.fn();
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    toggleTheme: mockToggleTheme,
  }),
}));

// Mock keyboard utils
jest.mock('@/lib/keyboard-utils', () => ({
  getPrimaryModifier: () => 'ctrl',
}));

function renderWithProvider() {
  return render(
    <KeyboardShortcutProvider>
      <GlobalShortcuts />
    </KeyboardShortcutProvider>
  );
}

describe('GlobalShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register global shortcuts without errors', () => {
    expect(() => renderWithProvider()).not.toThrow();
  });

  it('should open search with Ctrl+K', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'k',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOpenSearch).toHaveBeenCalled();
  });

  it('should open search with Ctrl+/', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: '/',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOpenSearch).toHaveBeenCalled();
  });

  it('should toggle theme with Ctrl+Shift+T', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 't',
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        metaKey: false,
      });
    });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('should navigate to dashboard with Ctrl+H', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'h',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should dispatch new task event with Ctrl+N', () => {
    renderWithProvider();

    const eventSpy = jest.spyOn(window, 'dispatchEvent');

    act(() => {
      fireEvent.keyDown(document, {
        key: 'n',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'keyboard-new-task',
      })
    );
  });

  it('should dispatch save event with Ctrl+S', () => {
    renderWithProvider();

    const eventSpy = jest.spyOn(window, 'dispatchEvent');

    act(() => {
      fireEvent.keyDown(document, {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'keyboard-save',
      })
    );
  });

  it('should dispatch navigate list event with Ctrl+1', () => {
    renderWithProvider();

    const eventSpy = jest.spyOn(window, 'dispatchEvent');

    act(() => {
      fireEvent.keyDown(document, {
        key: '1',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'keyboard-navigate-list',
        detail: { listIndex: 0 },
      })
    );
  });
});