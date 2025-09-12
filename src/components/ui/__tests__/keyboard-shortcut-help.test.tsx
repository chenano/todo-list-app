import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutHelp, ShortcutTooltip, ShortcutBadge } from '../keyboard-shortcut-help';

// Mock the keyboard shortcuts context
const mockSetShowHelp = jest.fn();
const mockGetShortcutGroups = jest.fn();

jest.mock('@/contexts/KeyboardShortcutContext', () => ({
  useKeyboardShortcuts: () => ({
    showHelp: true,
    setShowHelp: mockSetShowHelp,
    getShortcutGroups: mockGetShortcutGroups,
  }),
}));

describe('KeyboardShortcutHelp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetShortcutGroups.mockReturnValue([
      {
        id: 'global',
        name: 'Global',
        shortcuts: [
          {
            id: 'new-task',
            key: 'n',
            modifiers: ['ctrl'],
            context: 'global',
            description: 'Create new task',
            action: jest.fn(),
            enabled: true,
          },
          {
            id: 'save',
            key: 's',
            modifiers: ['ctrl'],
            context: 'global',
            description: 'Save changes',
            action: jest.fn(),
            enabled: true,
          },
        ],
      },
      {
        id: 'task',
        name: 'Task',
        shortcuts: [
          {
            id: 'toggle-complete',
            key: ' ',
            modifiers: [],
            context: 'task',
            description: 'Toggle task completion',
            action: jest.fn(),
            enabled: true,
          },
        ],
      },
    ]);
  });

  it('should render shortcut groups and shortcuts', () => {
    render(<KeyboardShortcutHelp />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Create new task')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
    expect(screen.getByText('Toggle task completion')).toBeInTheDocument();
  });

  it('should display formatted shortcuts', () => {
    render(<KeyboardShortcutHelp />);

    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
    // Space key is displayed as "Space" in formatShortcut
    expect(screen.getByText('Space')).toBeInTheDocument();
  });

  it('should show shortcut counts in badges', () => {
    render(<KeyboardShortcutHelp />);

    expect(screen.getByText('2 shortcuts')).toBeInTheDocument();
    expect(screen.getByText('1 shortcuts')).toBeInTheDocument();
  });

  it('should call setShowHelp when close button is clicked', () => {
    render(<KeyboardShortcutHelp />);

    // Get the close button by its aria-label or text content
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockSetShowHelp).toHaveBeenCalledWith(false);
  });

  it('should filter out disabled shortcuts', () => {
    mockGetShortcutGroups.mockReturnValue([
      {
        id: 'global',
        name: 'Global',
        shortcuts: [
          {
            id: 'enabled',
            key: 'n',
            modifiers: ['ctrl'],
            context: 'global',
            description: 'Enabled shortcut',
            action: jest.fn(),
            enabled: true,
          },
          {
            id: 'disabled',
            key: 'd',
            modifiers: ['ctrl'],
            context: 'global',
            description: 'Disabled shortcut',
            action: jest.fn(),
            enabled: false,
          },
        ],
      },
    ]);

    render(<KeyboardShortcutHelp />);

    expect(screen.getByText('Enabled shortcut')).toBeInTheDocument();
    expect(screen.queryByText('Disabled shortcut')).not.toBeInTheDocument();
  });

  it('should show empty state when no shortcuts are available', () => {
    mockGetShortcutGroups.mockReturnValue([]);

    render(<KeyboardShortcutHelp />);

    expect(screen.getByText('No keyboard shortcuts available')).toBeInTheDocument();
  });
});

describe('ShortcutTooltip', () => {
  it('should render children and tooltip content', () => {
    render(
      <ShortcutTooltip shortcut="Ctrl+N" description="Create new task">
        <button>New Task</button>
      </ShortcutTooltip>
    );

    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('Create new task')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
  });
});

describe('ShortcutBadge', () => {
  it('should render shortcut text', () => {
    render(<ShortcutBadge shortcut="Ctrl+S" />);

    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ShortcutBadge shortcut="Ctrl+S" className="custom-class" />);

    const badge = screen.getByText('Ctrl+S');
    expect(badge).toHaveClass('custom-class');
  });
});