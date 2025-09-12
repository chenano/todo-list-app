import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from '../export-dialog';
import { ExportService } from '@/lib/export';
import { List } from '@/lib/supabase/types';

// Mock the export service
jest.mock('@/lib/export');

const mockExportService = ExportService as jest.MockedClass<typeof ExportService>;

describe('ExportDialog', () => {
  const mockLists: List[] = [
    {
      id: 'list-1',
      user_id: 'user-1',
      name: 'Work Tasks',
      description: 'Tasks for work projects',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'list-2',
      user_id: 'user-1',
      name: 'Personal',
      description: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the static downloadFile method
    mockExportService.downloadFile = jest.fn();
    
    // Mock instance methods
    const mockInstance = {
      exportData: jest.fn(),
      getExportPreview: jest.fn(),
    };
    
    mockExportService.mockImplementation(() => mockInstance as any);
  });

  it('renders export dialog when open', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    expect(screen.getByText('Export Todo Lists')).toBeInTheDocument();
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('json')).toBeInTheDocument();
    expect(screen.getByText('csv')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ExportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    expect(screen.queryByText('Export Todo Lists')).not.toBeInTheDocument();
  });

  it('allows format selection', async () => {
    const user = userEvent.setup();
    
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    // Initially JSON should be selected - find the card container
    const jsonCard = screen.getByText('json').closest('.cursor-pointer');
    expect(jsonCard).toHaveClass('ring-2', 'ring-primary');

    // Click CSV format
    const csvCard = screen.getByText('csv').closest('.cursor-pointer');
    if (csvCard) {
      await user.click(csvCard);
    }

    // CSV should now be selected
    expect(csvCard).toHaveClass('ring-2', 'ring-primary');
  });

  it('displays list selection options', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    expect(screen.getByText('Select Lists to Export')).toBeInTheDocument();
    expect(screen.getByText('Work Tasks')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('allows list selection', async () => {
    const user = userEvent.setup();
    
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    // Select first list
    const workTasksCheckbox = screen.getByLabelText(/Work Tasks/);
    await user.click(workTasksCheckbox);

    expect(workTasksCheckbox).toBeChecked();
  });

  it('handles select all functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const selectAllButton = screen.getByText('Select All');
    await user.click(selectAllButton);

    // All checkboxes should be checked
    const workTasksCheckbox = screen.getByLabelText(/Work Tasks/);
    const personalCheckbox = screen.getByLabelText(/Personal/);
    
    expect(workTasksCheckbox).toBeChecked();
    expect(personalCheckbox).toBeChecked();

    // Button should now say "Deselect All"
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('displays export options', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    expect(screen.getByText('Export Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Include completed tasks')).toBeInTheDocument();
    expect(screen.getByLabelText('Include descriptions')).toBeInTheDocument();
    expect(screen.getByLabelText('Include due dates')).toBeInTheDocument();
    expect(screen.getByLabelText('Include priorities')).toBeInTheDocument();
  });

  it('allows toggling export options', async () => {
    const user = userEvent.setup();
    
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const completedTasksCheckbox = screen.getByLabelText('Include completed tasks');
    
    // Should be checked by default
    expect(completedTasksCheckbox).toBeChecked();

    // Uncheck it
    await user.click(completedTasksCheckbox);
    expect(completedTasksCheckbox).not.toBeChecked();
  });

  it('handles preview functionality', async () => {
    const user = userEvent.setup();
    const mockGetPreview = jest.fn().mockResolvedValue({
      success: true,
      preview: {
        lists: mockLists,
        tasks: [],
        totalLists: 2,
        totalTasks: 0,
      },
    });

    mockExportService.mockImplementation(() => ({
      getExportPreview: mockGetPreview,
      exportData: jest.fn(),
    }) as any);

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const previewButton = screen.getByText('Preview');
    await user.click(previewButton);

    await waitFor(() => {
      expect(mockGetPreview).toHaveBeenCalled();
    });

    // Should show preview section
    await waitFor(() => {
      expect(screen.getByText('Export Preview')).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    const mockExportData = jest.fn().mockResolvedValue({
      success: true,
      data: '{"test": "data"}',
      filename: 'test.json',
      mimeType: 'application/json',
    });

    mockExportService.mockImplementation(() => ({
      exportData: mockExportData,
      getExportPreview: jest.fn(),
    }) as any);

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalledWith({
        format: 'json',
        selectedLists: undefined,
        includeCompleted: true,
        includeDescription: true,
        includeDueDate: true,
        includePriority: true,
        includeCreatedAt: false,
        includeUpdatedAt: false,
      });
    });

    // Should trigger download
    await waitFor(() => {
      expect(mockExportService.downloadFile).toHaveBeenCalledWith(
        '{"test": "data"}',
        'test.json',
        'application/json'
      );
    });
  });

  it('shows progress during export', async () => {
    const user = userEvent.setup();
    let progressCallback: ((progress: any) => void) | undefined;

    const mockExportData = jest.fn().mockImplementation(() => {
      // Simulate progress updates
      if (progressCallback) {
        progressCallback({
          stage: 'fetching',
          progress: 50,
          message: 'Fetching data...',
        });
      }
      
      return Promise.resolve({
        success: true,
        data: '{"test": "data"}',
        filename: 'test.json',
        mimeType: 'application/json',
      });
    });

    mockExportService.mockImplementation((callback) => {
      progressCallback = callback;
      return {
        exportData: mockExportData,
        getExportPreview: jest.fn(),
      } as any;
    });

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    // Should show progress
    await waitFor(() => {
      expect(screen.getByText('Fetching data...')).toBeInTheDocument();
    });
  });

  it('handles export errors', async () => {
    const user = userEvent.setup();
    const mockExportData = jest.fn().mockResolvedValue({
      success: false,
      filename: '',
      mimeType: '',
      error: 'Export failed',
    });

    mockExportService.mockImplementation(() => ({
      exportData: mockExportData,
      getExportPreview: jest.fn(),
    }) as any);

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalled();
    });

    // Error should be handled gracefully (no crash)
    expect(exportButton).toBeInTheDocument();
  });

  it('resets state when dialog opens', () => {
    const { rerender } = render(
      <ExportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    // Open the dialog
    rerender(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    // State should be reset - no lists selected initially
    expect(screen.getByText('No lists selected. All lists will be exported.')).toBeInTheDocument();
  });

  it('shows format descriptions', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        lists={mockLists}
      />
    );

    expect(screen.getByText(/Complete data structure with all metadata/)).toBeInTheDocument();
    expect(screen.getByText(/Spreadsheet format for analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Human-readable format with formatted task lists/)).toBeInTheDocument();
  });
});