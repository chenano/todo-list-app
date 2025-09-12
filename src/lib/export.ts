import { format } from 'date-fns';
import { List, Task } from './supabase/types';
import { listService } from './lists';
import { taskService } from './tasks';
import { DatabaseError } from '../types';

export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  includeCompleted?: boolean;
  includeDescription?: boolean;
  includeDueDate?: boolean;
  includePriority?: boolean;
  includeCreatedAt?: boolean;
  includeUpdatedAt?: boolean;
  selectedLists?: string[]; // If empty, export all lists
}

export interface ExportData {
  lists: List[];
  tasks: Task[];
  exportedAt: string;
  totalLists: number;
  totalTasks: number;
}

export interface ExportProgress {
  stage: 'fetching' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  filename: string;
  mimeType: string;
  error?: string;
}

export class ExportService {
  private progressCallback?: (progress: ExportProgress) => void;

  constructor(progressCallback?: (progress: ExportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(stage: ExportProgress['stage'], progress: number, message: string, error?: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, error });
    }
  }

  /**
   * Export user data in the specified format
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      this.updateProgress('fetching', 10, 'Fetching lists...');

      // Fetch all lists or selected lists
      const { data: allLists, error: listsError } = await listService.getLists();
      if (listsError || !allLists) {
        throw new Error(listsError?.message || 'Failed to fetch lists');
      }

      // Filter lists if specific ones are selected
      const lists = options.selectedLists && options.selectedLists.length > 0
        ? allLists.filter(list => options.selectedLists!.includes(list.id))
        : allLists;

      this.updateProgress('fetching', 30, 'Fetching tasks...');

      // Fetch all tasks for the selected lists
      const allTasks: Task[] = [];
      for (const list of lists) {
        const { data: listTasks, error: tasksError } = await taskService.getTasksByListId(list.id);
        if (tasksError) {
          throw new Error(`Failed to fetch tasks for list ${list.name}: ${tasksError.message}`);
        }
        if (listTasks) {
          allTasks.push(...listTasks);
        }
      }

      // Filter tasks based on options
      const tasks = allTasks.filter(task => {
        if (!options.includeCompleted && task.completed) {
          return false;
        }
        return true;
      });

      this.updateProgress('processing', 60, 'Processing data...');

      const exportData: ExportData = {
        lists,
        tasks,
        exportedAt: new Date().toISOString(),
        totalLists: lists.length,
        totalTasks: tasks.length,
      };

      this.updateProgress('generating', 80, `Generating ${options.format.toUpperCase()} file...`);

      let result: ExportResult;
      switch (options.format) {
        case 'json':
          result = this.generateJsonExport(exportData, options);
          break;
        case 'csv':
          result = this.generateCsvExport(exportData, options);
          break;
        case 'markdown':
          result = this.generateMarkdownExport(exportData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      this.updateProgress('complete', 100, 'Export completed successfully!');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateProgress('error', 0, 'Export failed', errorMessage);
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Generate JSON export
   */
  private generateJsonExport(data: ExportData, options: ExportOptions): ExportResult {
    try {
      const jsonData = {
        metadata: {
          exportedAt: data.exportedAt,
          totalLists: data.totalLists,
          totalTasks: data.totalTasks,
          format: 'json',
          version: '1.0',
        },
        lists: data.lists,
        tasks: data.tasks,
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      
      return {
        success: true,
        data: jsonString,
        filename: `todo-export_${timestamp}.json`,
        mimeType: 'application/json',
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Failed to generate JSON export',
      };
    }
  }

  /**
   * Generate CSV export
   */
  private generateCsvExport(data: ExportData, options: ExportOptions): ExportResult {
    try {
      // Create a map of list names for quick lookup
      const listMap = new Map(data.lists.map(list => [list.id, list.name]));

      // Define CSV headers based on options
      const headers = ['List', 'Task Title'];
      
      if (options.includeDescription) headers.push('Description');
      if (options.includePriority) headers.push('Priority');
      if (options.includeDueDate) headers.push('Due Date');
      headers.push('Completed');
      if (options.includeCreatedAt) headers.push('Created At');
      if (options.includeUpdatedAt) headers.push('Updated At');

      // Generate CSV rows
      const rows = [headers.join(',')];
      
      for (const task of data.tasks) {
        const row = [
          `"${listMap.get(task.list_id) || 'Unknown List'}"`,
          `"${task.title.replace(/"/g, '""')}"`, // Escape quotes in title
        ];

        if (options.includeDescription) {
          row.push(`"${(task.description || '').replace(/"/g, '""')}"`);
        }
        if (options.includePriority) {
          row.push(task.priority);
        }
        if (options.includeDueDate) {
          row.push(task.due_date || '');
        }
        row.push(task.completed ? 'Yes' : 'No');
        if (options.includeCreatedAt) {
          row.push(format(new Date(task.created_at), 'yyyy-MM-dd HH:mm:ss'));
        }
        if (options.includeUpdatedAt) {
          row.push(format(new Date(task.updated_at), 'yyyy-MM-dd HH:mm:ss'));
        }

        rows.push(row.join(','));
      }

      const csvString = rows.join('\n');
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

      return {
        success: true,
        data: csvString,
        filename: `todo-export_${timestamp}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Failed to generate CSV export',
      };
    }
  }

  /**
   * Generate Markdown export
   */
  private generateMarkdownExport(data: ExportData, options: ExportOptions): ExportResult {
    try {
      const lines = [];
      
      // Header
      lines.push('# Todo Lists Export');
      lines.push('');
      lines.push(`**Exported on:** ${format(new Date(data.exportedAt), 'MMMM d, yyyy \'at\' h:mm a')}`);
      lines.push(`**Total Lists:** ${data.totalLists}`);
      lines.push(`**Total Tasks:** ${data.totalTasks}`);
      lines.push('');
      lines.push('---');
      lines.push('');

      // Group tasks by list
      const tasksByList = new Map<string, Task[]>();
      for (const task of data.tasks) {
        if (!tasksByList.has(task.list_id)) {
          tasksByList.set(task.list_id, []);
        }
        tasksByList.get(task.list_id)!.push(task);
      }

      // Generate markdown for each list
      for (const list of data.lists) {
        const listTasks = tasksByList.get(list.id) || [];
        
        lines.push(`## ${list.name}`);
        
        if (list.description) {
          lines.push('');
          lines.push(list.description);
        }
        
        lines.push('');
        
        if (listTasks.length === 0) {
          lines.push('*No tasks in this list*');
        } else {
          // Sort tasks: incomplete first, then by priority, then by due date
          const sortedTasks = listTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (a.priority !== b.priority) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            if (a.due_date && b.due_date) {
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            
            return 0;
          });

          for (const task of sortedTasks) {
            const checkbox = task.completed ? '- [x]' : '- [ ]';
            let taskLine = `${checkbox} ${task.title}`;
            
            // Add priority indicator
            if (options.includePriority && task.priority !== 'medium') {
              const priorityEmoji = task.priority === 'high' ? ' 🔴' : ' 🟡';
              taskLine += priorityEmoji;
            }
            
            // Add due date
            if (options.includeDueDate && task.due_date) {
              const dueDate = format(new Date(task.due_date), 'MMM d, yyyy');
              taskLine += ` (Due: ${dueDate})`;
            }
            
            lines.push(taskLine);
            
            // Add description as indented text
            if (options.includeDescription && task.description) {
              lines.push(`  ${task.description}`);
            }
          }
        }
        
        lines.push('');
        lines.push('---');
        lines.push('');
      }

      // Footer
      lines.push('*Generated by Todo List App*');

      const markdownString = lines.join('\n');
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

      return {
        success: true,
        data: markdownString,
        filename: `todo-export_${timestamp}.md`,
        mimeType: 'text/markdown',
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Failed to generate Markdown export',
      };
    }
  }

  /**
   * Download the exported data as a file
   */
  static downloadFile(data: string, filename: string, mimeType: string): void {
    try {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Get preview of export data (first few items)
   */
  async getExportPreview(options: ExportOptions): Promise<{
    success: boolean;
    preview?: {
      lists: List[];
      tasks: Task[];
      totalLists: number;
      totalTasks: number;
    };
    error?: string;
  }> {
    try {
      // Fetch lists
      const { data: allLists, error: listsError } = await listService.getLists();
      if (listsError || !allLists) {
        throw new Error(listsError?.message || 'Failed to fetch lists');
      }

      // Filter lists if specific ones are selected
      const lists = options.selectedLists && options.selectedLists.length > 0
        ? allLists.filter(list => options.selectedLists!.includes(list.id))
        : allLists;

      // Fetch tasks for preview (limit to first 10 tasks)
      const allTasks: Task[] = [];
      for (const list of lists.slice(0, 3)) { // Preview first 3 lists
        const { data: listTasks, error: tasksError } = await taskService.getTasksByListId(list.id);
        if (tasksError) {
          throw new Error(`Failed to fetch tasks for list ${list.name}: ${tasksError.message}`);
        }
        if (listTasks) {
          allTasks.push(...listTasks.slice(0, 5)); // First 5 tasks per list
        }
      }

      // Filter tasks based on options
      const tasks = allTasks.filter(task => {
        if (!options.includeCompleted && task.completed) {
          return false;
        }
        return true;
      });

      return {
        success: true,
        preview: {
          lists: lists.slice(0, 3), // Show first 3 lists in preview
          tasks: tasks.slice(0, 10), // Show first 10 tasks in preview
          totalLists: lists.length,
          totalTasks: tasks.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      };
    }
  }
}

// Export utility functions
export const exportService = new ExportService();

export const {
  exportData,
  getExportPreview,
} = exportService;

