import { ExportService, ExportOptions } from '../export';
import { List, Task } from '../supabase/types';
import { listService } from '../lists';
import { taskService } from '../tasks';

// Mock the services
jest.mock('../lists');
jest.mock('../tasks');

const mockListService = listService as jest.Mocked<typeof listService>;
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('ExportService', () => {
  let exportService: ExportService;
  let mockProgressCallback: jest.Mock;

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

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Complete project proposal',
      description: 'Write and submit the Q1 project proposal',
      completed: false,
      priority: 'high',
      due_date: '2024-01-15',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
    {
      id: 'task-2',
      list_id: 'list-1',
      user_id: 'user-1',
      title: 'Review code changes',
      description: null,
      completed: true,
      priority: 'medium',
      due_date: null,
      created_at: '2024-01-02T14:00:00Z',
      updated_at: '2024-01-03T09:00:00Z',
    },
    {
      id: 'task-3',
      list_id: 'list-2',
      user_id: 'user-1',
      title: 'Buy groceries',
      description: 'Milk, bread, eggs',
      completed: false,
      priority: 'low',
      due_date: '2024-01-10',
      created_at: '2024-01-03T16:00:00Z',
      updated_at: '2024-01-03T16:00:00Z',
    },
  ];

  beforeEach(() => {
    mockProgressCallback = jest.fn();
    exportService = new ExportService(mockProgressCallback);

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockListService.getLists.mockResolvedValue({
      data: mockLists,
      error: null,
    });

    mockTaskService.getTasksByListId.mockImplementation((listId) => {
      const tasks = mockTasks.filter(task => task.list_id === listId);
      return Promise.resolve({ data: tasks, error: null });
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
        includeDescription: true,
        includeDueDate: true,
        includePriority: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/todo-export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json/);
      
      if (result.data) {
        const exportedData = JSON.parse(result.data);
        expect(exportedData.metadata).toBeDefined();
        expect(exportedData.lists).toHaveLength(2);
        expect(exportedData.tasks).toHaveLength(3);
        expect(exportedData.metadata.totalLists).toBe(2);
        expect(exportedData.metadata.totalTasks).toBe(3);
      }
    });

    it('should export data in CSV format', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeCompleted: true,
        includeDescription: true,
        includeDueDate: true,
        includePriority: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/todo-export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
      
      if (result.data) {
        const lines = result.data.split('\n');
        expect(lines[0]).toContain('List,Task Title,Description,Priority,Due Date,Completed');
        expect(lines).toHaveLength(4); // Header + 3 tasks
      }
    });

    it('should export data in Markdown format', async () => {
      const options: ExportOptions = {
        format: 'markdown',
        includeCompleted: true,
        includeDescription: true,
        includeDueDate: true,
        includePriority: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/markdown');
      expect(result.filename).toMatch(/todo-export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md/);
      
      if (result.data) {
        expect(result.data).toContain('# Todo Lists Export');
        expect(result.data).toContain('## Work Tasks');
        expect(result.data).toContain('## Personal');
        expect(result.data).toContain('- [ ] Complete project proposal');
        expect(result.data).toContain('- [x] Review code changes');
      }
    });

    it('should filter out completed tasks when includeCompleted is false', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCompleted: false,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      
      if (result.data) {
        const exportedData = JSON.parse(result.data);
        expect(exportedData.tasks).toHaveLength(2); // Only incomplete tasks
        expect(exportedData.tasks.every((task: Task) => !task.completed)).toBe(true);
      }
    });

    it('should export only selected lists when specified', async () => {
      const options: ExportOptions = {
        format: 'json',
        selectedLists: ['list-1'],
        includeCompleted: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      
      if (result.data) {
        const exportedData = JSON.parse(result.data);
        expect(exportedData.lists).toHaveLength(1);
        expect(exportedData.lists[0].id).toBe('list-1');
        expect(exportedData.tasks).toHaveLength(2); // Only tasks from list-1
        expect(exportedData.tasks.every((task: Task) => task.list_id === 'list-1')).toBe(true);
      }
    });

    it('should call progress callback during export', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      await exportService.exportData(options);

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'fetching',
          progress: 10,
          message: 'Fetching lists...',
        })
      );

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'complete',
          progress: 100,
          message: 'Export completed successfully!',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockListService.getLists.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'error',
          error: expect.stringContaining('Database error'),
        })
      );
    });
  });

  describe('getExportPreview', () => {
    it('should return preview data', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      const result = await exportService.getExportPreview(options);

      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
      
      if (result.preview) {
        expect(result.preview.lists).toHaveLength(2);
        expect(result.preview.tasks).toHaveLength(3);
        expect(result.preview.totalLists).toBe(2);
        expect(result.preview.totalTasks).toBe(3);
      }
    });

    it('should limit preview data', async () => {
      // Add more mock lists to test limiting
      const manyLists = Array.from({ length: 10 }, (_, i) => ({
        ...mockLists[0],
        id: `list-${i}`,
        name: `List ${i}`,
      }));

      mockListService.getLists.mockResolvedValue({
        data: manyLists,
        error: null,
      });

      const options: ExportOptions = {
        format: 'json',
        includeCompleted: true,
      };

      const result = await exportService.getExportPreview(options);

      expect(result.success).toBe(true);
      
      if (result.preview) {
        expect(result.preview.lists.length).toBeLessThanOrEqual(3); // Limited to 3 in preview
        expect(result.preview.totalLists).toBe(10); // But total count is correct
      }
    });
  });

  describe('CSV export formatting', () => {
    it('should properly escape quotes in CSV', async () => {
      const taskWithQuotes: Task = {
        ...mockTasks[0],
        title: 'Task with "quotes" in title',
        description: 'Description with "quotes" too',
      };

      mockTaskService.getTasksByListId.mockResolvedValue({
        data: [taskWithQuotes],
        error: null,
      });

      const options: ExportOptions = {
        format: 'csv',
        includeCompleted: true,
        includeDescription: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      
      if (result.data) {
        expect(result.data).toContain('"Task with ""quotes"" in title"');
        expect(result.data).toContain('"Description with ""quotes"" too"');
      }
    });

    it('should include only selected fields in CSV', async () => {
      const options: ExportOptions = {
        format: 'csv',
        includeCompleted: true,
        includeDescription: false,
        includeDueDate: false,
        includePriority: true,
        includeCreatedAt: false,
        includeUpdatedAt: false,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      
      if (result.data) {
        const lines = result.data.split('\n');
        const header = lines[0];
        expect(header).toBe('List,Task Title,Priority,Completed');
        expect(header).not.toContain('Description');
        expect(header).not.toContain('Due Date');
      }
    });
  });

  describe('Markdown export formatting', () => {
    it('should sort tasks properly in markdown', async () => {
      const options: ExportOptions = {
        format: 'markdown',
        includeCompleted: true,
        includePriority: true,
      };

      const result = await exportService.exportData(options);

      expect(result.success).toBe(true);
      
      if (result.data) {
        // Incomplete tasks should come before completed ones
        const incompleteIndex = result.data.indexOf('- [ ] Complete project proposal');
        const completedIndex = result.data.indexOf('- [x] Review code changes');
        expect(incompleteIndex).toBeLessThan(completedIndex);
        
        // High priority tasks should have red indicator
        expect(result.data).toContain('Complete project proposal 🔴');
      }
    });
  });
});

describe('ExportService static methods', () => {
  describe('downloadFile', () => {
    let mockCreateObjectURL: jest.Mock;
    let mockRevokeObjectURL: jest.Mock;
    let mockClick: jest.Mock;
    let mockAppendChild: jest.Mock;
    let mockRemoveChild: jest.Mock;

    beforeEach(() => {
      mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      mockRevokeObjectURL = jest.fn();
      mockClick = jest.fn();
      mockAppendChild = jest.fn();
      mockRemoveChild = jest.fn();

      // Mock URL methods
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      const data = 'test data';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      ExportService.downloadFile(data, filename, mimeType);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.any(Blob)
      );
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});