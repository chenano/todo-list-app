import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from '@/components/ui/import-dialog';
import { ExportDialog } from '@/components/ui/export-dialog';
import { importData, exportData } from '@/lib/import';
import { generateTasks, generateLists } from '../utils/test-data-generators';
import type { Task, List } from '@/types';

// Mock file operations
const mockFileReader = {
  readAsText: jest.fn(),
  result: '',
  onload: null as any,
  onerror: null as any,
};

global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock download functionality
const mockDownload = jest.fn();
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockDownload,
        style: {},
      };
    }
    return {};
  }),
});

describe('Import/Export Integration Tests', () => {
  const mockOnImport = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.result = '';
  });

  describe('Export Functionality', () => {
    it('should export tasks in JSON format', async () => {
      const user = userEvent.setup();
      const testTasks = generateTasks({ count: 10 });
      const testLists = generateLists({ count: 2 });

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          tasks={testTasks}
          lists={testLists}
        />
      );

      // Select JSON format
      await user.click(screen.getByLabelText(/json/i));

      // Click export button
      await user.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'json',
            data: expect.objectContaining({
              tasks: testTasks,
              lists: testLists,
            }),
          })
        );
      });
    });

    it('should export tasks in CSV format', async () => {
      const user = userEvent.setup();
      const testTasks = generateTasks({ count: 5 });

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          tasks={testTasks}
          lists={[]}
        />
      );

      // Select CSV format
      await user.click(screen.getByLabelText(/csv/i));

      // Select fields to export
      await user.click(screen.getByLabelText(/title/i));
      await user.click(screen.getByLabelText(/priority/i));
      await user.click(screen.getByLabelText(/completed/i));

      // Click export button
      await user.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'csv',
            fields: expect.arrayContaining(['title', 'priority', 'completed']),
          })
        );
      });
    });

    it('should export tasks in Markdown format', async () => {
      const user = userEvent.setup();
      const testTasks = generateTasks({ count: 3 });
      const testLists = generateLists({ count: 1 });

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          tasks={testTasks}
          lists={testLists}
        />
      );

      // Select Markdown format
      await user.click(screen.getByLabelText(/markdown/i));

      // Click export button
      await user.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'markdown',
          })
        );
      });
    });

    it('should show export progress for large datasets', async () => {
      const user = userEvent.setup();
      const largeTasks = generateTasks({ count: 1000 });

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          tasks={largeTasks}
          lists={[]}
        />
      );

      // Select JSON format
      await user.click(screen.getByLabelText(/json/i));

      // Click export button
      await user.click(screen.getByText('Export Data'));

      // Should show progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock export function to throw error
      mockOnExport.mockImplementation(() => {
        throw new Error('Export failed');
      });

      render(
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          tasks={[]}
          lists={[]}
        />
      );

      // Select JSON format and export
      await user.click(screen.getByLabelText(/json/i));
      await user.click(screen.getByText('Export Data'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    it('should import JSON data successfully', async () => {
      const user = userEvent.setup();
      const testData = {
        tasks: generateTasks({ count: 5 }),
        lists: generateLists({ count: 2 }),
        version: '1.0',
        exportedAt: new Date().toISOString(),
      };

      mockFileReader.result = JSON.stringify(testData);

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Create a mock file
      const file = new File([JSON.stringify(testData)], 'test-data.json', {
        type: 'application/json',
      });

      // Upload file
      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload();

      // Should show preview
      await waitFor(() => {
        expect(screen.getByText(/5 tasks/i)).toBeInTheDocument();
        expect(screen.getByText(/2 lists/i)).toBeInTheDocument();
      });

      // Click import button
      await user.click(screen.getByText('Import Data'));

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(
          expect.objectContaining({
            tasks: testData.tasks,
            lists: testData.lists,
          })
        );
      });
    });

    it('should import CSV data successfully', async () => {
      const user = userEvent.setup();
      const csvData = `title,description,priority,completed
Task 1,Description 1,high,false
Task 2,Description 2,medium,true
Task 3,Description 3,low,false`;

      mockFileReader.result = csvData;

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Create a mock CSV file
      const file = new File([csvData], 'test-data.csv', {
        type: 'text/csv',
      });

      // Upload file
      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload();

      // Should show CSV preview with field mapping
      await waitFor(() => {
        expect(screen.getByText(/map fields/i)).toBeInTheDocument();
      });

      // Map fields
      await user.selectOptions(screen.getByLabelText(/title field/i), 'title');
      await user.selectOptions(screen.getByLabelText(/description field/i), 'description');

      // Click import button
      await user.click(screen.getByText('Import Data'));

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(
          expect.objectContaining({
            tasks: expect.arrayContaining([
              expect.objectContaining({
                title: 'Task 1',
                priority: 'high',
                completed: false,
              }),
            ]),
          })
        );
      });
    });

    it('should validate imported data', async () => {
      const user = userEvent.setup();
      const invalidData = {
        tasks: [
          { id: '1', title: '', completed: 'invalid' }, // Invalid data
        ],
        lists: [],
      };

      mockFileReader.result = JSON.stringify(invalidData);

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const file = new File([JSON.stringify(invalidData)], 'invalid-data.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      mockFileReader.onload();

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument();
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Import button should be disabled
      expect(screen.getByText('Import Data')).toBeDisabled();
    });

    it('should handle large file imports with progress tracking', async () => {
      const user = userEvent.setup();
      const largeData = {
        tasks: generateTasks({ count: 5000 }),
        lists: generateLists({ count: 100 }),
      };

      mockFileReader.result = JSON.stringify(largeData);

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const file = new File([JSON.stringify(largeData)], 'large-data.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      mockFileReader.onload();

      // Click import button
      await user.click(screen.getByText('Import Data'));

      // Should show progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/importing/i)).toBeInTheDocument();
    });

    it('should handle import conflicts', async () => {
      const user = userEvent.setup();
      const conflictingData = {
        tasks: [
          {
            id: 'existing-task-1',
            title: 'Updated Task Title',
            completed: true,
          },
        ],
        lists: [
          {
            id: 'existing-list-1',
            name: 'Updated List Name',
          },
        ],
      };

      mockFileReader.result = JSON.stringify(conflictingData);

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const file = new File([JSON.stringify(conflictingData)], 'conflict-data.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      mockFileReader.onload();

      // Should show conflict resolution options
      await waitFor(() => {
        expect(screen.getByText(/conflicts detected/i)).toBeInTheDocument();
      });

      // Choose resolution strategy
      await user.click(screen.getByLabelText(/merge with existing/i));

      // Click import button
      await user.click(screen.getByText('Import Data'));

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(
          expect.objectContaining({
            conflictResolution: 'merge',
          })
        );
      });
    });

    it('should support different file formats', async () => {
      const formats = [
        { ext: 'json', type: 'application/json' },
        { ext: 'csv', type: 'text/csv' },
        { ext: 'txt', type: 'text/plain' },
      ];

      for (const format of formats) {
        const user = userEvent.setup();
        
        render(
          <ImportDialog
            isOpen={true}
            onClose={mockOnClose}
            onImport={mockOnImport}
          />
        );

        const file = new File(['test data'], `test.${format.ext}`, {
          type: format.type,
        });

        const fileInput = screen.getByLabelText(/choose file/i);
        await user.upload(fileInput, file);

        // Should accept the file format
        expect(fileInput.files?.[0]).toBe(file);
      }
    });

    it('should handle import errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock import function to throw error
      mockOnImport.mockImplementation(() => {
        throw new Error('Import failed');
      });

      mockFileReader.result = JSON.stringify({ tasks: [], lists: [] });

      render(
        <ImportDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });

      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);

      mockFileReader.onload();

      // Click import button
      await user.click(screen.getByText('Import Data'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle export of large datasets efficiently', async () => {
      const largeTasks = generateTasks({ count: 10000 });
      const largeLists = generateLists({ count: 500 });

      const startTime = performance.now();

      const exportedData = exportData({
        tasks: largeTasks,
        lists: largeLists,
        format: 'json',
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should export within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(exportedData).toBeDefined();
    });

    it('should handle import of large datasets efficiently', async () => {
      const largeData = {
        tasks: generateTasks({ count: 5000 }),
        lists: generateLists({ count: 200 }),
      };

      const startTime = performance.now();

      const importedData = importData(JSON.stringify(largeData), 'json');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should import within 1 second
      expect(duration).toBeLessThan(1000);
      expect(importedData.tasks).toHaveLength(5000);
      expect(importedData.lists).toHaveLength(200);
    });

    it('should not cause memory leaks during large operations', () => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple large export/import operations
      for (let i = 0; i < 10; i++) {
        const data = {
          tasks: generateTasks({ count: 1000 }),
          lists: generateLists({ count: 50 }),
        };

        const exported = exportData({ ...data, format: 'json' });
        const imported = importData(exported, 'json');

        // Verify data integrity
        expect(imported.tasks).toHaveLength(1000);
        expect(imported.lists).toHaveLength(50);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});