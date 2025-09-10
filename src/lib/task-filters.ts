import { Task, TaskFilters, TaskSort } from '../types';

/**
 * Filter tasks based on the provided filters
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    // Filter by status
    if (filters.status === 'completed' && !task.completed) {
      return false;
    }
    if (filters.status === 'incomplete' && task.completed) {
      return false;
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Filter by overdue status
    if (filters.overdue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!task.due_date || task.completed) {
        return false;
      }
      
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate >= today) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort tasks based on the provided sort criteria
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      
      case 'due_date':
        // Handle null due dates - put them at the end
        if (!a.due_date && !b.due_date) {
          comparison = 0;
        } else if (!a.due_date) {
          comparison = 1;
        } else if (!b.due_date) {
          comparison = -1;
        } else {
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        break;
      
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      
      case 'title':
        comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        break;
      
      default:
        comparison = 0;
    }

    return sort.direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Apply both filtering and sorting to a list of tasks
 */
export function filterAndSortTasks(
  tasks: Task[], 
  filters: TaskFilters, 
  sort: TaskSort
): Task[] {
  const filtered = filterTasks(tasks, filters);
  return sortTasks(filtered, sort);
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

/**
 * Get the count of tasks matching specific criteria
 */
export function getTaskCounts(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const incomplete = total - completed;
  const overdue = tasks.filter(task => isTaskOverdue(task)).length;
  
  const byPriority = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  };

  return {
    total,
    completed,
    incomplete,
    overdue,
    byPriority,
  };
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return !!(
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    filters.overdue
  );
}

/**
 * Clear all filters
 */
export function clearFilters(): TaskFilters {
  return {
    status: 'all',
    priority: 'all',
    overdue: false,
  };
}

/**
 * Get default sort configuration
 */
export function getDefaultSort(): TaskSort {
  return {
    field: 'created_at',
    direction: 'desc',
  };
}

/**
 * Check if sort is different from default
 */
export function hasCustomSort(sort: TaskSort): boolean {
  const defaultSort = getDefaultSort();
  return sort.field !== defaultSort.field || sort.direction !== defaultSort.direction;
}

/**
 * Get available sort options
 */
export function getSortOptions() {
  return [
    { value: 'created_at', label: 'Date Created' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
  ] as const;
}

/**
 * Get available filter options
 */
export function getFilterOptions() {
  return {
    status: [
      { value: 'all', label: 'All Tasks' },
      { value: 'incomplete', label: 'Incomplete' },
      { value: 'completed', label: 'Completed' },
    ] as const,
    priority: [
      { value: 'all', label: 'All Priorities' },
      { value: 'high', label: 'High Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'low', label: 'Low Priority' },
    ] as const,
  };
}