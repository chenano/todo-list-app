// Tests for OfflineIndicator component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineIndicator } from '../offline-indicator';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineOperations } from '@/hooks/useOfflineOperations';

// Mock hooks
jest.mock('@/hooks/useOfflineStatus');
jest.mock('@/hooks/useOfflineOperations');

const mockUseOfflineStatus = useOfflineStatus as jest.MockedFunction<typeof useOfflineStatus>;
const mockUseOfflineOperations = useOfflineOperations as jest.MockedFunction<typeof useOfflineOperations>;

describe('OfflineIndicator', () => {
  const defaultOfflineStatus = {
    isOnline: true,
    isOffline: false,
    lastOnline: new Date(),
    connectionType: '4g',
    networkInfo: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    },
    testConnectivity: jest.fn(),
    refresh: jest.fn()
  };

  const defaultQueueStatus = {
    pendingOperations: 0,
    isProcessing: false,
    lastSync: new Date(),
    errors: []
  };

  const defaultOperations = {
    queueStatus: defaultQueueStatus,
    queueOperation: jest.fn(),
    syncOperations: jest.fn(),
    clearQueue: jest.fn(),
    clearErrors: jest.fn(),
    forceSync: jest.fn(),
    updateQueueStatus: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOfflineStatus.mockReturnValue(defaultOfflineStatus);
    mockUseOfflineOperations.mockReturnValue(defaultOperations);
  });

  describe('online status', () => {
    it('should show online status when connected', () => {
      render(<OfflineIndicator />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('text-green-600');
    });

    it('should show offline status when disconnected', () => {
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('text-red-600');
    });

    it('should show syncing status when processing', () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          isProcessing: true
        }
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('text-blue-600');
    });

    it('should show pending operations count', () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          pendingOperations: 3
        }
      });

      render(<OfflineIndicator />);
      
      expect(screen.getByText('3 pending')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Badge
      expect(screen.getByRole('button')).toHaveClass('text-yellow-600');
    });
  });

  describe('details mode', () => {
    it('should show only icon when showDetails is false', () => {
      render(<OfflineIndicator showDetails={false} />);
      
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
      // When showDetails is false, there's no button, just the icon
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should show popover when clicked', async () => {
      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('Sync Status')).toBeInTheDocument();
      });
    });

    it('should show network information in popover', async () => {
      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('4G • 10 Mbps • 50ms')).toBeInTheDocument();
      });
    });

    it('should show last online time when offline', async () => {
      const lastOnline = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true,
        lastOnline
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
        expect(screen.getByText(/Last online: 5m ago/)).toBeInTheDocument();
      });
    });

    it('should show pending operations in popover', async () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          pendingOperations: 2
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('2 operation(s) pending sync')).toBeInTheDocument();
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });
    });

    it('should show sync button only when online', async () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          pendingOperations: 1
        }
      });

      // Test online state
      const { unmount } = render(<OfflineIndicator />);
      fireEvent.click(screen.getByRole('button', { name: /1 pending/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });

      unmount();

      // Test offline state
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      render(<OfflineIndicator />);
      fireEvent.click(screen.getByRole('button', { name: /offline/i }));
      
      await waitFor(() => {
        expect(screen.queryByText('Sync Now')).not.toBeInTheDocument();
      });
    });

    it('should call forceSync when sync button is clicked', async () => {
      const mockForceSync = jest.fn();
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        forceSync: mockForceSync,
        queueStatus: {
          ...defaultQueueStatus,
          pendingOperations: 1
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Sync Now'));
      
      expect(mockForceSync).toHaveBeenCalled();
    });

    it('should show sync errors', async () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          errors: ['CREATE tasks: Network error', 'UPDATE lists: Validation failed']
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Sync Errors')).toBeInTheDocument();
        expect(screen.getByText('CREATE tasks: Network error')).toBeInTheDocument();
        expect(screen.getByText('UPDATE lists: Validation failed')).toBeInTheDocument();
      });
    });

    it('should clear errors when clear button is clicked', async () => {
      const mockClearErrors = jest.fn();
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        clearErrors: mockClearErrors,
        queueStatus: {
          ...defaultQueueStatus,
          errors: ['Some error']
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear'));
      
      expect(mockClearErrors).toHaveBeenCalled();
    });

    it('should show offline mode info when disconnected', async () => {
      mockUseOfflineStatus.mockReturnValue({
        ...defaultOfflineStatus,
        isOnline: false,
        isOffline: true
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(/You're working offline/)).toBeInTheDocument();
      });
    });

    it('should show last sync time', async () => {
      const lastSync = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          lastSync
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(/Last sync: 10m ago/)).toBeInTheDocument();
      });
    });

    it('should disable sync button when processing', async () => {
      mockUseOfflineOperations.mockReturnValue({
        ...defaultOperations,
        queueStatus: {
          ...defaultQueueStatus,
          pendingOperations: 1,
          isProcessing: true
        }
      });

      render(<OfflineIndicator />);
      
      fireEvent.click(screen.getByRole('button', { name: /syncing/i }));
      
      await waitFor(() => {
        const syncButtons = screen.getAllByRole('button', { name: /syncing/i });
        const syncButton = syncButtons.find(button => button.textContent?.includes('Syncing...') && !button.getAttribute('aria-haspopup'));
        expect(syncButton).toBeDisabled();
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });
    });
  });

  describe('time formatting', () => {
    it('should format recent times correctly', async () => {
      const testCases = [
        { offset: 0, expected: 'Just now' },
        { offset: 30 * 1000, expected: 'Just now' }, // 30 seconds
        { offset: 2 * 60 * 1000, expected: '2m ago' }, // 2 minutes
        { offset: 90 * 60 * 1000, expected: '1h ago' }, // 1.5 hours
        { offset: 25 * 60 * 60 * 1000, expected: '1d ago' }, // 25 hours
      ];

      for (const { offset, expected } of testCases) {
        const lastOnline = new Date(Date.now() - offset);
        mockUseOfflineStatus.mockReturnValue({
          ...defaultOfflineStatus,
          isOnline: false,
          isOffline: true,
          lastOnline
        });

        const { unmount } = render(<OfflineIndicator />);
        
        fireEvent.click(screen.getByRole('button', { name: /offline/i }));
        
        await waitFor(() => {
          expect(screen.getByText(`Last online: ${expected}`)).toBeInTheDocument();
        });

        // Clean up for next iteration - unmount and remount
        unmount();
      }
    });
  });
});