import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkSelectionProvider } from '@/contexts/BulkSelectionContext';
import { BulkActionBar } from '@/components/tasks/BulkActionBar';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import type { Task } from '@/types';

// Mock the hooks
jest.mock('@/hooks/useBulkOperations');
jest.mock('@/hooks/useTasks');

const mockUseBulkOperations = useBulkOperations as jest.MockedFunction<typeof useBulkOperations>;

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'medium',
    due_date: '2024-01-15',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 2',
    description: 'Description 2',
    completed: false,
    priority: 'high',
    due_date: '2024-01-20',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
  },
  {
    id: '3',
    list_id: 'list1',
    user_id: 'user1',
    title: 'Task 3',
    description: 'Description 3',
    completed: true,
    priority: 'low',
    due_date: null,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
];

const TestComponent = ({ tasks }: { tasks: Task[] }) => {
  return (
    <BulkSelectionProvider>
      <div>
        <BulkActionBar />
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </BulkSelectionProvider>
  );
};

describe('Bulk Operations Integration Tests', () => {
  const mockBulkComplete = jest.fn();
  const mockBulkDelete = jest.fn();
  const mockBulkMove = jest.fn();
  const mockBulkUpdatePriority = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseBulkOperations.mockReturnValue({
      bulkComplete: mockBulkComplete,
      bulkDelete: mockBulkDelete,
      bulkMove: mockBulkMove,
      bulkUpdatePriority: mockBulkUpdatePriority,
      bulkUpdateDueDate: jest.fn(),
      isLoading: false,
      progress: null,
      error: null,
    });
  });

  describe('Task Selection', () => {
    it('should allow selecting multiple tasks', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select first task
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(firstCheckbox).toBeChecked();

      // Select second task
      const secondCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(secondCheckbox);
      expect(secondCheckbox).toBeChecked();

      // Bulk action bar should be visible
      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
    });

    it('should show selection count in bulk action bar', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select two tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    });

    it('should allow selecting all tasks', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Click select all button
      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      expect(screen.getByText(/3 selected/)).toBeInTheDocument();
    });

    it('should allow deselecting all tasks', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select all first
      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      // Then deselect all
      const deselectAllButton = screen.getByText('Deselect All');
      await user.click(deselectAllButton);

      // All checkboxes should be unchecked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });

      // Bulk action bar should be hidden
      expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
    });
  });

  describe('Bulk Complete Operation', () => {
    it('should complete selected tasks', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select incomplete tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Task 1 (incomplete)
      await user.click(checkboxes[1]); // Task 2 (incomplete)

      // Click bulk complete
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);

      expect(mockBulkComplete).toHaveBeenCalledWith(['1', '2']);
    });

    it('should show confirmation for bulk complete', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Click bulk complete
      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);

      // Should show confirmation dialog
      expect(screen.getByText(/complete 2 tasks/i)).toBeInTheDocument();
    });
  });

  describe('Bulk Delete Operation', () => {
    it('should delete selected tasks with confirmation', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      // Click bulk delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText(/delete 2 tasks/i)).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByText('Delete Tasks');
      await user.click(confirmButton);

      expect(mockBulkDelete).toHaveBeenCalledWith(['1', '3']);
    });

    it('should cancel bulk delete operation', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      // Click bulk delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      // Cancel deletion
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockBulkDelete).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Move Operation', () => {
    it('should move selected tasks to another list', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Click bulk move
      const moveButton = screen.getByText('Move');
      await user.click(moveButton);

      // Should show list selection dialog
      expect(screen.getByText(/move 2 tasks/i)).toBeInTheDocument();

      // Select target list (mock)
      const targetListOption = screen.getByText('Work List');
      await user.click(targetListOption);

      // Confirm move
      const confirmMoveButton = screen.getByText('Move Tasks');
      await user.click(confirmMoveButton);

      expect(mockBulkMove).toHaveBeenCalledWith(['1', '2'], 'work-list-id');
    });
  });

  describe('Bulk Priority Update', () => {
    it('should update priority for selected tasks', async () => {
      const user = userEvent.setup();
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      // Click priority dropdown
      const priorityButton = screen.getByText('Priority');
      await user.click(priorityButton);

      // Select high priority
      const highPriorityOption = screen.getByText('High');
      await user.click(highPriorityOption);

      expect(mockBulkUpdatePriority).toHaveBeenCalledWith(['1', '3'], 'high');
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress during bulk operations', async () => {
      // Mock loading state
      mockUseBulkOperations.mockReturnValue({
        bulkComplete: mockBulkComplete,
        bulkDelete: mockBulkDelete,
        bulkMove: mockBulkMove,
        bulkUpdatePriority: mockBulkUpdatePriority,
        bulkUpdateDueDate: jest.fn(),
        isLoading: true,
        progress: { completed: 2, total: 5, operation: 'complete' },
        error: null,
      });

      render(<TestComponent tasks={mockTasks} />);

      // Should show progress indicator
      expect(screen.getByText(/completing tasks/i)).toBeInTheDocument();
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('should show error state during bulk operations', async () => {
      // Mock error state
      mockUseBulkOperations.mockReturnValue({
        bulkComplete: mockBulkComplete,
        bulkDelete: mockBulkDelete,
        bulkMove: mockBulkMove,
        bulkUpdatePriority: mockBulkUpdatePriority,
        bulkUpdateDueDate: jest.fn(),
        isLoading: false,
        progress: null,
        error: 'Failed to complete tasks',
      });

      render(<TestComponent tasks={mockTasks} />);

      // Should show error message
      expect(screen.getByText('Failed to complete tasks')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support keyboard shortcuts for bulk operations', async () => {
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks first
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Test Ctrl+A for select all
      fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
      
      // All checkboxes should be selected
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      // Test Delete key for bulk delete
      fireEvent.keyDown(document, { key: 'Delete' });
      
      // Should show delete confirmation
      expect(screen.getByText(/delete 3 tasks/i)).toBeInTheDocument();
    });

    it('should support Escape key to cancel selection', async () => {
      render(<TestComponent tasks={mockTasks} />);

      // Select tasks
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Selection should be cleared
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });

      // Bulk action bar should be hidden
      expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument();
    });
  });

  describe('Performance with Large Selections', () => {
    it('should handle large selections efficiently', async () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTasks[0],
        id: `task-${i}`,
        title: `Task ${i}`,
      }));

      const user = userEvent.setup();
      const startTime = performance.now();
      
      render(<TestComponent tasks={largeTasks} />);

      // Select all tasks
      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
      expect(screen.getByText(/1000 selected/)).toBeInTheDocument();
    });
  });
});