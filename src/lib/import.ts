import { List, Task, ListInsert, TaskInsert } from './supabase/types';
import { listService } from './lists';
import { taskService } from './tasks';
import { DatabaseError } from '../types';

export type ImportFormat = 'json' | 'csv' | 'todoist' | 'any-do';

export interface ImportOptions {
  format?: ImportFormat; // Auto-detected if not provided
  createNewLists?: boolean; // Create new lists or merge into existing ones
  skipDuplicates?: boolean; // Skip tasks that already exist
  listMapping?: Record<string, string>; // Map imported list names to existing list IDs
}

export interface ImportData {
  lists: Partial<List>[];
  tasks: Partial<Task>[];
  metadata?: {
    source?: string;
    version?: string;
    exportedAt?: string;
  };
}

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  importedLists: number;
  importedTasks: number;
  skippedTasks: number;
  errors: string[];
  createdListIds?: string[];
  error?: string;
}

export interface ImportPreview {
  format: ImportFormat;
  lists: Array<{
    name: string;
    description?: string;
    taskCount: number;
    exists?: boolean; // If a list with this name already exists
  }>;
  tasks: Array<{
    title: string;
    listName: string;
    completed: boolean;
    priority?: string;
    dueDate?: string;
  }>;
  totalLists: number;
  totalTasks: number;
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  line?: number;
}

export class ImportService {
  private progressCallback?: (progress: ImportProgress) => void;

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(
    stage: ImportProgress['stage'],
    progress: number,
    message: string,
    processed?: number,
    total?: number,
    error?: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, processed, total, error });
    }
  }

  /**
   * Detect the format of the import data
   */
  detectFormat(data: string): ImportFormat {
    const trimmedData = data.trim();
    
    // Try JSON first
    try {
      const parsed = JSON.parse(trimmedData);
      
      // Check for our export format
      if (parsed.metadata && parsed.lists && parsed.tasks) {
        return 'json';
      }
      
      // Check for Todoist format
      if (parsed.projects && parsed.items) {
        return 'todoist';
      }
      
      // Check for Any.do format
      if (parsed.categories || (Array.isArray(parsed) && parsed[0]?.categoryName)) {
        return 'any-do';
      }
      
      return 'json'; // Default to JSON if it's valid JSON
    } catch {
      // Not JSON, check for CSV
      const lines = trimmedData.split('\n');
      if (lines.length > 1 && lines[0].includes(',')) {
        return 'csv';
      }
    }
    
    throw new Error('Unable to detect import format. Supported formats: JSON, CSV, Todoist, Any.do');
  }

  /**
   * Parse import data based on format
   */
  async parseImportData(data: string, format?: ImportFormat): Promise<ImportData> {
    const detectedFormat = format || this.detectFormat(data);
    
    switch (detectedFormat) {
      case 'json':
        return this.parseJsonData(data);
      case 'csv':
        return this.parseCsvData(data);
      case 'todoist':
        return this.parseTodoistData(data);
      case 'any-do':
        return this.parseAnyDoData(data);
      default:
        throw new Error(`Unsupported import format: ${detectedFormat}`);
    }
  }

  /**
   * Parse JSON export data
   */
  private parseJsonData(data: string): ImportData {
    try {
      const parsed = JSON.parse(data);
      
      // Handle our own export format
      if (parsed.metadata && parsed.lists && parsed.tasks) {
        return {
          lists: parsed.lists,
          tasks: parsed.tasks,
          metadata: parsed.metadata,
        };
      }
      
      // Handle simple JSON format with lists and tasks
      if (parsed.lists && parsed.tasks) {
        return {
          lists: parsed.lists,
          tasks: parsed.tasks,
        };
      }
      
      // Handle simple JSON format
      if (Array.isArray(parsed)) {
        // Assume it's an array of tasks
        return {
          lists: [{ name: 'Imported Tasks', description: 'Tasks imported from JSON file' }],
          tasks: parsed.map((item: any) => ({
            title: item.title || item.name || String(item),
            description: item.description || null,
            completed: Boolean(item.completed || item.done),
            priority: this.normalizePriority(item.priority),
            due_date: item.due_date || item.dueDate || null,
          })),
        };
      }
      
      throw new Error('Invalid JSON format. Expected export data or array of tasks.');
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Parse CSV data
   */
  private parseCsvData(data: string): ImportData {
    const lines = data.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = this.parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const tasks: Partial<Task>[] = [];
    const listNames = new Set<string>();

    // Map common header variations
    const headerMap: Record<string, string> = {
      'task': 'title',
      'task title': 'title',
      'name': 'title',
      'title': 'title',
      'description': 'description',
      'notes': 'description',
      'completed': 'completed',
      'done': 'completed',
      'status': 'completed',
      'priority': 'priority',
      'due date': 'due_date',
      'due': 'due_date',
      'duedate': 'due_date',
      'list': 'list_name',
      'category': 'list_name',
      'project': 'list_name',
    };

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const task: any = {};
      
      for (let j = 0; j < Math.min(headers.length, values.length); j++) {
        const header = headers[j];
        const mappedField = headerMap[header] || header;
        const value = values[j].trim();
        
        if (!value) continue;

        switch (mappedField) {
          case 'title':
            task.title = value;
            break;
          case 'description':
            task.description = value;
            break;
          case 'completed':
            task.completed = ['true', 'yes', '1', 'done', 'completed'].includes(value.toLowerCase());
            break;
          case 'priority':
            task.priority = this.normalizePriority(value);
            break;
          case 'due_date':
            task.due_date = this.parseDate(value);
            break;
          case 'list_name':
            task.list_name = value;
            listNames.add(value);
            break;
        }
      }

      if (task.title) {
        if (!task.list_name) {
          task.list_name = 'Imported Tasks';
          listNames.add('Imported Tasks');
        }
        tasks.push(task);
      }
    }

    const lists = Array.from(listNames).map(name => ({
      name,
      description: `Imported from CSV file`,
    }));

    return { lists, tasks };
  }

  /**
   * Parse Todoist export data
   */
  private parseTodoistData(data: string): ImportData {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.projects || !parsed.items) {
        throw new Error('Invalid Todoist format. Expected projects and items arrays.');
      }

      const projectMap = new Map(
        parsed.projects.map((project: any) => [project.id, project.name])
      );

      const lists = parsed.projects.map((project: any) => ({
        name: project.name,
        description: `Imported from Todoist project`,
      }));

      const tasks = parsed.items.map((item: any) => ({
        title: item.content,
        description: item.description || null,
        completed: item.checked === 1,
        priority: this.todoistPriorityToNormal(item.priority),
        due_date: item.due ? this.parseDate(item.due.date) : null,
        list_name: projectMap.get(item.project_id) || 'Inbox',
      }));

      return { lists, tasks };
    } catch (error) {
      throw new Error(`Failed to parse Todoist data: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  /**
   * Parse Any.do export data
   */
  private parseAnyDoData(data: string): ImportData {
    try {
      const parsed = JSON.parse(data);
      
      let categories: any[] = [];
      
      if (parsed.categories) {
        categories = parsed.categories;
      } else if (Array.isArray(parsed)) {
        categories = parsed;
      } else {
        throw new Error('Invalid Any.do format');
      }

      const lists: Partial<List>[] = [];
      const tasks: Partial<Task>[] = [];

      for (const category of categories) {
        const listName = category.categoryName || category.name || 'Imported List';
        
        lists.push({
          name: listName,
          description: 'Imported from Any.do',
        });

        if (category.tasks && Array.isArray(category.tasks)) {
          for (const task of category.tasks) {
            tasks.push({
              title: task.title || task.name,
              description: task.note || null,
              completed: task.status === 'DONE' || task.completed,
              priority: this.normalizePriority(task.priority),
              due_date: task.dueDate ? this.parseDate(task.dueDate) : null,
              // list_name is not part of Task type, removing this property
            });
          }
        }
      }

      return { lists, tasks };
    } catch (error) {
      throw new Error(`Failed to parse Any.do data: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  /**
   * Validate import data
   */
  validateImportData(data: ImportData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate lists
    for (let i = 0; i < data.lists.length; i++) {
      const list = data.lists[i];
      if (!list.name || list.name.trim().length === 0) {
        errors.push({
          field: `lists[${i}].name`,
          message: 'List name is required',
        });
      }
    }

    // Validate tasks
    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      if (!task.title || task.title.trim().length === 0) {
        errors.push({
          field: `tasks[${i}].title`,
          message: 'Task title is required',
        });
      }
      
      if (task.priority && !['low', 'medium', 'high'].includes(task.priority as string)) {
        errors.push({
          field: `tasks[${i}].priority`,
          message: 'Priority must be low, medium, or high',
        });
      }
    }

    return errors;
  }

  /**
   * Generate import preview
   */
  async generatePreview(data: string, options: ImportOptions = {}): Promise<ImportPreview> {
    try {
      const format = options.format || this.detectFormat(data);
      const importData = await this.parseImportData(data, format);
      const validationErrors = this.validateImportData(importData);
      
      // Get existing lists to check for duplicates
      const { data: existingLists } = await listService.getLists();
      const existingListNames = new Set(existingLists?.map(l => l.name.toLowerCase()) || []);

      const preview: ImportPreview = {
        format,
        lists: importData.lists.map(list => ({
          name: list.name || 'Unnamed List',
          description: list.description || undefined,
          taskCount: importData.tasks.filter(task => 
            (task as any).list_name === list.name || 
            (!task.list_id && list.name === 'Imported Tasks')
          ).length,
          exists: existingListNames.has((list.name || '').toLowerCase()),
        })),
        tasks: importData.tasks.slice(0, 10).map(task => ({
          title: task.title || 'Untitled Task',
          listName: (task as any).list_name || 'Unknown List',
          completed: task.completed || false,
          priority: task.priority || undefined,
          dueDate: task.due_date || undefined,
        })),
        totalLists: importData.lists.length,
        totalTasks: importData.tasks.length,
        warnings: validationErrors.map(error => `${error.field}: ${error.message}`),
      };

      return preview;
    } catch (error) {
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data into the database
   */
  async importData(data: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      this.updateProgress('parsing', 10, 'Parsing import data...');

      const format = options.format || this.detectFormat(data);
      const importData = await this.parseImportData(data, format);

      this.updateProgress('validating', 20, 'Validating data...');

      const validationErrors = this.validateImportData(importData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      this.updateProgress('importing', 30, 'Creating lists...');

      // Import lists
      const listMapping = new Map<string, string>();
      const createdListIds: string[] = [];
      let importedLists = 0;

      for (const listData of importData.lists) {
        if (!listData.name) continue;

        let listId: string;

        // Check if list already exists
        const { data: existingLists } = await listService.getLists();
        const existingList = existingLists?.find(l => 
          l.name.toLowerCase() === listData.name!.toLowerCase()
        );

        if (existingList && !options.createNewLists) {
          listId = existingList.id;
          listMapping.set(listData.name, listId);
        } else {
          // Create new list
          const { data: newList, error } = await listService.createList({
            name: options.createNewLists && existingList 
              ? `${listData.name} (Imported)` 
              : listData.name,
            description: listData.description || `Imported from ${format} file`,
          });

          if (error || !newList) {
            throw new Error(`Failed to create list "${listData.name}": ${error?.message}`);
          }

          listId = newList.id;
          listMapping.set(listData.name, listId);
          createdListIds.push(listId);
          importedLists++;
        }
      }

      this.updateProgress('importing', 60, 'Importing tasks...', 0, importData.tasks.length);

      // Import tasks
      let importedTasks = 0;
      let skippedTasks = 0;
      const errors: string[] = [];

      for (let i = 0; i < importData.tasks.length; i++) {
        const taskData = importData.tasks[i];
        if (!taskData.title) {
          skippedTasks++;
          continue;
        }

        try {
          // Find the list ID
          const listName = (taskData as any).list_name || 'Imported Tasks';
          const listId = listMapping.get(listName);
          
          if (!listId) {
            errors.push(`Task "${taskData.title}": List "${listName}" not found`);
            skippedTasks++;
            continue;
          }

          // Check for duplicates if requested
          if (options.skipDuplicates) {
            const { data: existingTasks } = await taskService.getTasksByListId(listId);
            const duplicate = existingTasks?.find(t => 
              t.title.toLowerCase() === taskData.title!.toLowerCase()
            );
            
            if (duplicate) {
              skippedTasks++;
              continue;
            }
          }

          // Create task
          const { error } = await taskService.createTask(listId, {
            title: taskData.title,
            description: taskData.description || '',
            priority: (taskData.priority as 'low' | 'medium' | 'high') || 'medium',
            due_date: taskData.due_date || '',
          });

          if (error) {
            errors.push(`Task "${taskData.title}": ${error.message}`);
            skippedTasks++;
          } else {
            importedTasks++;
          }

          // Update progress
          this.updateProgress(
            'importing',
            60 + (i / importData.tasks.length) * 30,
            'Importing tasks...',
            i + 1,
            importData.tasks.length
          );
        } catch (error) {
          errors.push(`Task "${taskData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          skippedTasks++;
        }
      }

      this.updateProgress('complete', 100, 'Import completed successfully!');

      return {
        success: true,
        importedLists,
        importedTasks,
        skippedTasks,
        errors,
        createdListIds,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateProgress('error', 0, 'Import failed', undefined, undefined, errorMessage);
      
      return {
        success: false,
        importedLists: 0,
        importedTasks: 0,
        skippedTasks: 0,
        errors: [errorMessage],
      };
    }
  }

  // Helper methods

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private normalizePriority(priority: any): 'low' | 'medium' | 'high' {
    if (!priority) return 'medium';
    
    const p = String(priority).toLowerCase();
    
    if (['high', '1', 'urgent', 'important'].includes(p)) return 'high';
    if (['low', '3', '4', 'minor'].includes(p)) return 'low';
    
    return 'medium';
  }

  private todoistPriorityToNormal(priority: number): 'low' | 'medium' | 'high' {
    // Todoist uses 1-4, where 4 is highest priority
    if (priority >= 4) return 'high';
    if (priority <= 2) return 'low';
    return 'medium';
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return null;
    }
  }
}

// Export utility functions
export const importService = new ImportService();

export const {
  detectFormat,
  parseImportData,
  validateImportData,
  generatePreview,
  importData,
} = importService;

