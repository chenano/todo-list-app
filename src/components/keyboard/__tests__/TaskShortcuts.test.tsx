import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { TaskShortcuts } from '../TaskShortcuts';
import { KeyboardShortcutProvider } from '@/contexts/KeyboardShortcutContext';
import { BulkSelectionProvider } from '@/contexts/BulkSelectionContext';

const mockOnToggleComplete = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnMoveUp = jest.fn();
const mockOnMoveDown = jest.fn();

function renderWithProviders(props = {}) {
  const defaultProps = {
    taskId: 'task-1',
    onToggleComplete: mockOnToggleComplete,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    ...props,
  };

  return render(
    <KeyboardShortcutProvider>
      <BulkSelectionProvider>
        <TaskShortcuts {...defaultProps} />
      </BulkSelectionProvider>
    </KeyboardShortcutProvider>
  );
}

describe('TaskShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register task shortcuts without errors', () => {
    expect(() => renderWithProviders()).not.toThrow();
  });

  it('should toggle task completion with Space', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnToggleComplete).toHaveBeenCalledWith('task-1');
  });

  it('should edit task with Enter', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnEdit).toHaveBeenCalledWith('task-1');
  });

  it('should edit task with E', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'e',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnEdit).toHaveBeenCalledWith('task-1');
  });

  it('should delete task with Delete', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Delete',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });

  it('should delete task with Backspace', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'Backspace',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });

  it('should move task up with Ctrl+ArrowUp', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'ArrowUp',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnMoveUp).toHaveBeenCalledWith('task-1');
  });

  it('should move task down with Ctrl+ArrowDown', () => {
    renderWithProviders();

    act(() => {
      fireEvent.keyDown(document, {
        key: 'ArrowDown',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnMoveDown).toHaveBeenCalledWith('task-1');
  });

  it('should not execute shortcuts when taskId is not provided', () => {
    renderWithProviders({ taskId: undefined });

    act(() => {
      fireEvent.keyDown(document, {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnToggleComplete).not.toHaveBeenCalled();
  });

  it('should not execute shortcuts when handlers are not provided', () => {
    renderWithProviders({ onToggleComplete: undefined });

    act(() => {
      fireEvent.keyDown(document, {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });

    expect(mockOnToggleComplete).not.toHaveBeenCalled();
  });
});