import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, isToday, parseISO } from 'date-fns';

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date utility functions
export const dateUtils = {
  /**
   * Format a date string to a readable format
   */
  formatDate: (dateString: string, formatStr: string = 'MMM dd, yyyy'): string => {
    try {
      const date = parseISO(dateString);
      return format(date, formatStr);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  },

  /**
   * Format a date to relative time (e.g., "2 days ago", "in 3 hours")
   */
  formatRelativeTime: (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Invalid date';
    }
  },

  /**
   * Check if a date is overdue (past today)
   */
  isOverdue: (dateString: string): boolean => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return isBefore(date, today) && !isToday(date);
    } catch (error) {
      console.error('Error checking if date is overdue:', error);
      return false;
    }
  },

  /**
   * Check if a date is today
   */
  isToday: (dateString: string): boolean => {
    try {
      const date = parseISO(dateString);
      return isToday(date);
    } catch (error) {
      console.error('Error checking if date is today:', error);
      return false;
    }
  },

  /**
   * Check if a date is in the future
   */
  isFuture: (dateString: string): boolean => {
    try {
      const date = parseISO(dateString);
      return isAfter(date, new Date());
    } catch (error) {
      console.error('Error checking if date is in future:', error);
      return false;
    }
  },

  /**
   * Format date for HTML date input
   */
  formatForInput: (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  },

  /**
   * Get today's date in ISO format
   */
  getTodayISO: (): string => {
    return new Date().toISOString().split('T')[0];
  },
};

// Data formatting utilities
export const formatUtils = {
  /**
   * Capitalize first letter of a string
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Truncate text to specified length with ellipsis
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  },

  /**
   * Format priority with proper casing
   */
  formatPriority: (priority: 'low' | 'medium' | 'high'): string => {
    return formatUtils.capitalize(priority);
  },

  /**
   * Get priority color class for Tailwind CSS
   */
  getPriorityColor: (priority: 'low' | 'medium' | 'high'): string => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[priority];
  },

  /**
   * Get priority icon name for Lucide icons
   */
  getPriorityIcon: (priority: 'low' | 'medium' | 'high'): string => {
    const icons = {
      low: 'ArrowDown',
      medium: 'Minus',
      high: 'ArrowUp',
    };
    return icons[priority];
  },

  /**
   * Format task count for display
   */
  formatTaskCount: (count: number): string => {
    if (count === 0) return 'No tasks';
    if (count === 1) return '1 task';
    return `${count} tasks`;
  },

  /**
   * Generate initials from email for avatar
   */
  getInitials: (email: string): string => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  },
};

// Validation utilities
export const validationUtils = {
  /**
   * Check if email is valid format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if password meets requirements
   */
  isValidPassword: (password: string): boolean => {
    return password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  },

  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
};

// Array utilities for data manipulation
export const arrayUtils = {
  /**
   * Sort tasks by priority (high -> medium -> low)
   */
  sortByPriority: <T extends { priority: 'low' | 'medium' | 'high' }>(
    items: T[],
    direction: 'asc' | 'desc' = 'desc'
  ): T[] => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...items].sort((a, b) => {
      const aValue = priorityOrder[a.priority];
      const bValue = priorityOrder[b.priority];
      return direction === 'desc' ? bValue - aValue : aValue - bValue;
    });
  },

  /**
   * Sort items by date
   */
  sortByDate: <T extends { [K in keyof T]: string }>(
    items: T[],
    dateField: keyof T,
    direction: 'asc' | 'desc' = 'desc'
  ): T[] => {
    return [...items].sort((a, b) => {
      const aDate = new Date(a[dateField] as string);
      const bDate = new Date(b[dateField] as string);
      return direction === 'desc' 
        ? bDate.getTime() - aDate.getTime()
        : aDate.getTime() - bDate.getTime();
    });
  },

  /**
   * Filter tasks by completion status
   */
  filterByStatus: <T extends { completed: boolean }>(
    items: T[],
    status: 'all' | 'completed' | 'incomplete'
  ): T[] => {
    if (status === 'all') return items;
    return items.filter(item => 
      status === 'completed' ? item.completed : !item.completed
    );
  },

  /**
   * Filter tasks by priority
   */
  filterByPriority: <T extends { priority: 'low' | 'medium' | 'high' }>(
    items: T[],
    priority: 'low' | 'medium' | 'high' | 'all'
  ): T[] => {
    if (priority === 'all') return items;
    return items.filter(item => item.priority === priority);
  },

  /**
   * Filter tasks by overdue status
   */
  filterByOverdue: <T extends { due_date?: string | null }>(
    items: T[],
    showOverdue: boolean
  ): T[] => {
    if (!showOverdue) return items;
    return items.filter(item => 
      item.due_date && dateUtils.isOverdue(item.due_date)
    );
  },

  /**
   * Search items by text in specified fields
   */
  searchItems: <T extends Record<string, any>>(
    items: T[],
    query: string,
    searchFields: (keyof T)[]
  ): T[] => {
    if (!query.trim()) return items;
    
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
               typeof value === 'string' && 
               value.toLowerCase().includes(lowercaseQuery);
      })
    );
  },

  /**
   * Group items by a specified field
   */
  groupBy: <T extends Record<string, any>, K extends keyof T>(
    items: T[],
    key: K
  ): Record<string, T[]> => {
    return items.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Remove duplicates from array based on a key
   */
  uniqueBy: <T extends Record<string, any>, K extends keyof T>(
    items: T[],
    key: K
  ): T[] => {
    const seen = new Set();
    return items.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },
};

// Local storage utilities
export const storageUtils = {
  /**
   * Safely get item from localStorage
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Safely set item in localStorage
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear: (): void => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// URL utilities for managing query parameters
export const urlUtils = {
  /**
   * Build query string from object
   */
  buildQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  },

  /**
   * Parse query string to object
   */
  parseQueryString: (queryString: string): Record<string, string | string[]> => {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string | string[]> = {};
    
    params.forEach((value, key) => {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          (result[key] as string[]).push(value);
        } else {
          result[key] = [result[key] as string, value];
        }
      } else {
        result[key] = value;
      }
    });
    
    return result;
  },

  /**
   * Update URL with new query parameters
   */
  updateQueryParams: (
    params: Record<string, any>,
    replace: boolean = false
  ): void => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    
    if (replace) {
      url.search = '';
    }
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      } else {
        url.searchParams.delete(key);
      }
    });
    
    window.history.pushState({}, '', url.toString());
  },
};