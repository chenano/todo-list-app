import { ImportService, ImportOptions } from '../import';
import { List, Task } from '../supabase/types';
import { listService } from '../lists';
import { taskService } from '../tasks';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the services
jest.mock('../lists');
jest.mock('../tasks');

const mockListService = listService as jest.Mocked<typeof listService>;
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('ImportService', () => {
  let importService: ImportService;
  let mockProgressCallback: jest.Mock;

  const mockExistingLists: List[] = [
    {
      id: 'existing-list-1',
      user_id: 'user-1',
      name: 'Existing List',
      description: 'An existing list',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockProgressCallback = jest.fn();
    importService = new ImportService(mockProgressCallback);

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockListService.getLists.mockResolvedValue({
      data: mockExistingLists,
      error: null,
    });

    mockListService.createList.mockResolvedValue({
      data: {
        id: 'new-list-1',
        user_id: 'user-1',
        name: 'New List',
        description: 'A new list',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    mockTaskService.createTask.mockResolvedValue({
      data: {
        id: 'new-task-1',
        list_id: 'new-list-1',
        user_id: 'user-1',
        title: 'New Task',
        description: null,
        completed: false,
        priority: 'medium',
        due_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    mockTaskService.getTasksByListId.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  describe('detectFormat', () => {
    it('should detect JSON format', () => {
      const jsonData = JSON.stringify({
        metadata: { version: '1.0' },
        lists: [],
        tasks: [],
      });

      const format = importService.detectFormat(jsonData);
      expect(format).toBe('json');
    });

    it('should detect Todoist format', () => {
      const todoistData = JSON.stringify({
        projects: [{ id: 1, name: 'Project 1' }],
        items: [{ id: 1, content: 'Task 1', project_id: 1 }],
      });

      const format = importService.detectFormat(todoistData);
      expect(format).toBe('todoist');
    });

    it('should detect Any.do format', () => {
      const anyDoData = JSON.stringify({
        categories: [
          {
            categoryName: 'Personal',
            tasks: [{ title: 'Task 1' }],
          },
        ],
      });

      const format = importService.detectFormat(anyDoData);
      expect(format).toBe('any-do');
    });

    it('should detect CSV format', () => {
      const csvData = 'List,Task Title,Completed\nWork,Complete project,false';

      const format = importService.detectFormat(csvData);
      expect(format).toBe('csv');
    });

    it('should throw error for unknown format', () => {
      const unknownData = 'This is not a valid format';

      expect(() => importService.detectFormat(unknownData)).toThrow(
        'Unable to detect import format'
      );
    });
  });

  describe('parseImportData', () => {
    it('should parse JSON export format', async () => {
      const jsonData = JSON.stringify({
        metadata: { version: '1.0' },
        lists: [{ name: 'Work', description: 'Work tasks' }],
        tasks: [{ title: 'Task 1', completed: false, priority: 'high' }],
      });

      const result = await importService.parseImportData(jsonData, 'json');

      expect(result.lists).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
      expect(result.lists[0].name).toBe('Work');
      expect(result.tasks[0].title).toBe('Task 1');
    });

    it('should parse CSV format', async () => {
      const csvData = `List,Task Title,Description,Completed,Priority
Work,Complete project,Finish the Q1 project,false,high
Personal,Buy groceries,Milk and bread,true,low`;

      const result = await importService.parseImportData(csvData, 'csv');

      expect(result.lists).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.lists.map(l => l.name)).toEqual(['Work', 'Personal']);
      expect(result.tasks[0].title).toBe('Complete project');
      expect(result.tasks[0].priority).toBe('high');
      expect(result.tasks[1].completed).toBe(true);
    });

    it('should parse Todoist format', async () => {
      const todoistData = JSON.stringify({
        projects: [
          { id: 1, name: 'Work' },
          { id: 2, name: 'Personal' },
        ],
        items: [
          {
            id: 1,
            content: 'Complete project',
            description: 'Finish the Q1 project',
            checked: 0,
            priority: 4,
            project_id: 1,
            due: { date: '2024-01-15' },
          },
          {
            id: 2,
            content: 'Buy groceries',
            checked: 1,
            priority: 1,
            project_id: 2,
          },
        ],
      });

      const result = await importService.parseImportData(todoistData, 'todoist');

      expect(result.lists).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].title).toBe('Complete project');
      expect(result.tasks[0].priority).toBe('high'); // Priority 4 -> high
      expect(result.tasks[0].due_date).toBe('2024-01-15');
      expect(result.tasks[1].completed).toBe(true); // checked: 1 -> true
    });

    it('should parse Any.do format', async () => {
      const anyDoData = JSON.stringify({
        categories: [
          {
            categoryName: 'Work',
            tasks: [
              {
                title: 'Complete project',
                note: 'Finish the Q1 project',
                status: 'ACTIVE',
                priority: 'HIGH',
                dueDate: '2024-01-15T00:00:00Z',
              },
            ],
          },
          {
            categoryName: 'Personal',
            tasks: [
              {
                title: 'Buy groceries',
                status: 'DONE',
                priority: 'LOW',
              },
            ],
          },
        ],
      });

      const result = await importService.parseImportData(anyDoData, 'any-do');

      expect(result.lists).toHaveLength(2);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].title).toBe('Complete project');
      expect(result.tasks[0].description).toBe('Finish the Q1 project');
      expect(result.tasks[0].priority).toBe('high');
      expect(result.tasks[1].completed).toBe(true); // status: DONE -> true
    });
  });

  describe('validateImportData', () => {
    it('should validate correct data without errors', () => {
      const data = {
        lists: [{ name: 'Work' }],
        tasks: [{ title: 'Task 1', priority: 'high' }],
      };

      const errors = importService.validateImportData(data);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const data = {
        lists: [{ name: '' }, { name: 'Valid List' }],
        tasks: [{ title: '' }, { title: 'Valid Task', priority: 'invalid' }],
      };

      const errors = importService.validateImportData(data);
      expect(errors).toHaveLength(3);
      expect(errors[0].message).toContain('List name is required');
      expect(errors[1].message).toContain('Task title is required');
      expect(errors[2].message).toContain('Priority must be');
    });
  });

  describe('generatePreview', () => {
    it('should generate preview for valid data', async () => {
      const jsonData = JSON.stringify({
        lists: [{ name: 'Work' }, { name: 'Existing List' }],
        tasks: [
          { title: 'Task 1', list_name: 'Work', completed: false, priority: 'high' },
          { title: 'Task 2', list_name: 'Existing List', completed: true },
        ],
      });

      const preview = await importService.generatePreview(jsonData);

      expect(preview.format).toBe('json');
      expect(preview.totalLists).toBe(2);
      expect(preview.totalTasks).toBe(2);
      expect(preview.lists[0].name).toBe('Work');
      expect(preview.lists[0].exists).toBe(false);
      expect(preview.lists[1].name).toBe('Existing List');
      expect(preview.lists[1].exists).toBe(true); // Should match existing list
      expect(preview.tasks).toHaveLength(2);
    });

    it('should include warnings for validation errors', async () => {
      const jsonData = JSON.stringify({
        lists: [{ name: '' }],
        tasks: [{ title: '', priority: 'invalid' }],
      });

      const preview = await importService.generatePreview(jsonData);

      expect(preview.warnings.length).toBeGreaterThan(0);
      expect(preview.warnings.some(w => w.includes('List name is required'))).toBe(true);
    });
  });

  describe('importData', () => {
    it('should import data successfully', async () => {
      const jsonData = JSON.stringify({
        lists: [{ name: 'New Work List', description: 'Work tasks' }],
        tasks: [
          {
            title: 'Complete project',
            description: 'Finish the Q1 project',
            completed: false,
            priority: 'high',
            due_date: '2024-01-15',
            list_name: 'New Work List',
          },
        ],
      });

      const result = await importService.importData(jsonData);

      expect(result.success).toBe(true);
      expect(result.importedLists).toBe(1);
      expect(result.importedTasks).toBe(1);
      expect(result.skippedTasks).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(mockListService.createList).toHaveBeenCalledWith({
        name: 'New Work List',
        description: 'Work tasks',
      });

      expect(mockTaskService.createTask).toHaveBeenCalledWith('new-list-1', {
        title: 'Complete project',
        description: 'Finish the Q1 project',
        priority: 'high',
        due_date: '2024-01-15',
      });
    });

    it('should use existing lists when createNewLists is false', async () => {
      const jsonData = JSON.stringify({
        lists: [{ name: 'Existing List' }],
        tasks: [{ title: 'New Task', list_name: 'Existing List' }],
      });

      const options: ImportOptions = {
        createNewLists: false,
      };

      const result = await importService.importData(jsonData, options);

      expect(result.success).toBe(true);
      expect(result.importedLists).toBe(0); // No new lists created
      expect(result.importedTasks).toBe(1);

      expect(mockListService.createList).not.toHaveBeenCalled();
      expect(mockTaskService.createTask).toHaveBeenCalledWith('existing-list-1', {
        title: 'New Task',
        description: '',
        priority: 'medium',
        due_date: '',
      });
    });

    it('should skip duplicate tasks when skipDuplicates is true', async () => {
      // Mock existing tasks
      mockTaskService.getTasksByListId.mockResolvedValue({
        data: [
          {
            id: 'existing-task-1',
            list_id: 'existing-list-1',
            user_id: 'user-1',
            title: 'Existing Task',
            description: null,
            completed: false,
            priority: 'medium',
            due_date: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });

      const jsonData = JSON.stringify({
        lists: [{ name: 'Existing List' }],
        tasks: [
          { title: 'Existing Task', list_name: 'Existing List' }, // Should be skipped
          { title: 'New Task', list_name: 'Existing List' }, // Should be imported
        ],
      });

      const options: ImportOptions = {
        createNewLists: false,
        skipDuplicates: true,
      };

      const result = await importService.importData(jsonData, options);

      expect(result.success).toBe(true);
      expect(result.importedTasks).toBe(1);
      expect(result.skippedTasks).toBe(1);

      // Should only create the new task
      expect(mockTaskService.createTask).toHaveBeenCalledTimes(1);
      expect(mockTaskService.createTask).toHaveBeenCalledWith('existing-list-1', {
        title: 'New Task',
        description: '',
        priority: 'medium',
        due_date: '',
      });
    });

    it('should handle errors gracefully', async () => {
      mockListService.createList.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const jsonData = JSON.stringify({
        lists: [{ name: 'New List' }],
        tasks: [],
      });

      const result = await importService.importData(jsonData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create list "New List": Database error');
    });

    it('should call progress callback during import', async () => {
      const jsonData = JSON.stringify({
        lists: [{ name: 'New List' }],
        tasks: [{ title: 'Task 1', list_name: 'New List' }],
      });

      await importService.importData(jsonData);

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'parsing',
          progress: 10,
          message: 'Parsing import data...',
        })
      );

      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'complete',
          progress: 100,
          message: 'Import completed successfully!',
        })
      );
    });
  });

  describe('CSV parsing edge cases', () => {
    it('should handle CSV with quoted fields containing commas', async () => {
      const csvData = `List,Task Title,Description
Work,"Task with, comma","Description with, comma"`;

      const result = await importService.parseImportData(csvData, 'csv');

      expect(result.tasks[0].title).toBe('Task with, comma');
      expect(result.tasks[0].description).toBe('Description with, comma');
    });

    it('should handle CSV with quoted fields containing quotes', async () => {
      const csvData = `List,Task Title
Work,"Task with ""quotes"""`; 

      const result = await importService.parseImportData(csvData, 'csv');

      expect(result.tasks[0].title).toBe('Task with "quotes"');
    });

    it('should handle various completion status formats', async () => {
      const csvData = `Task Title,Completed
Task 1,true
Task 2,yes
Task 3,1
Task 4,done
Task 5,completed
Task 6,false`;

      const result = await importService.parseImportData(csvData, 'csv');

      expect(result.tasks[0].completed).toBe(true);
      expect(result.tasks[1].completed).toBe(true);
      expect(result.tasks[2].completed).toBe(true);
      expect(result.tasks[3].completed).toBe(true);
      expect(result.tasks[4].completed).toBe(true);
      expect(result.tasks[5].completed).toBe(false);
    });
  });
});