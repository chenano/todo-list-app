import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { FormShortcuts } from '../FormShortcuts';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();
const mockOnSubmit = jest.fn();

// Mock keyboard utils
jest.mock('@/lib/keyboard-utils', () => ({
  getPrimaryModifier: () => 'ctrl',
}));

function renderWithProvider(props = {}) {
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    onSubmit: mockOnSubmit,
    canSave: true,
    canCancel: true,
    ...props,
  };

  return render(
    <KeyboardShortcutProvider>
      <FormShortcuts {...defaultProps} />
    </KeyboardShortcutProvider>
  );
}

describe('FormShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register form shortcuts without errors', () => {
    expect(() => renderWithProvider()).not.toThrow();
  });

  it('should save form with Ctrl+S', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should submit form with Ctrl+Enter', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should cancel form with Escape', () => {
    renderWithProvider();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Escape',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should not save when canSave is false', () => {
    renderWithProvider({ canSave: false });

    act(() => {
      fireEvent.keyDown(document, {
        key: 's',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not cancel when canCancel is false', () => {
    renderWithProvider({ canCancel: false });

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Escape',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should fallback to save when submit is not provided', () => {
    renderWithProvider({ onSubmit: undefined });

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should handle global save events', () => {
    renderWithProvider();

    act(() => {
      window.dispatchEvent(new Event('keyboard-save'));
    });

    expect(mockOnSave).toHaveBeenCalled();
  });
});