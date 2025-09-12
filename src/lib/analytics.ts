import { 
  Task, 
  List, 
  AnalyticsEvent, 
  ProductivityMetrics, 
  PriorityDistribution, 
  TimePattern, 
  StreakData, 
  TrendData, 
  DailyTrend, 
  WeeklyTrend, 
  MonthlyTrend, 
  AnalyticsFilter,
  Priority 
} from '@/types';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format, 
  parseISO, 
  differenceInDays, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  getHours,
  getDay,
  isWithinInterval,
  subDays,
  addDays
} from 'date-fns';

const ANALYTICS_STORAGE_KEY = 'todo-analytics-events';
const ANALYTICS_VERSION = '1.0.0';

/**
 * Analytics data collection and processing for productivity insights
 * All data is stored locally for privacy protection
 */
export class AnalyticsManager {
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.loadEvents();
  }

  /**
   * Load analytics events from localStorage
   */
  private loadEvents(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === ANALYTICS_VERSION && Array.isArray(data.events)) {
          this.events = data.events;
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
      this.events = [];
    }
  }

  /**
   * Save analytics events to localStorage
   */
  private saveEvents(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const data = {
        version: ANALYTICS_VERSION,
        events: this.events,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }

  /**
   * Record an analytics event
   */
  recordEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const analyticsEvent: AnalyticsEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // Clean up old events (keep last 365 days)
    this.cleanupOldEvents();
  }

  /**
   * Clean up events older than 365 days
   */
  private cleanupOldEvents(): void {
    const cutoffDate = subDays(new Date(), 365);
    const initialLength = this.events.length;
    
    this.events = this.events.filter(event => 
      parseISO(event.timestamp) > cutoffDate
    );

    if (this.events.length !== initialLength) {
      this.saveEvents();
    }
  }

  /**
   * Record task creation event
   */
  recordTaskCreated(task: Task): void {
    this.recordEvent({
      type: 'task_created',
      data: {
        taskId: task.id,
        listId: task.list_id,
        priority: task.priority,
        dueDate: task.due_date
      }
    });
  }

  /**
   * Record task completion event
   */
  recordTaskCompleted(task: Task, completionTime?: number): void {
    this.recordEvent({
      type: 'task_completed',
      data: {
        taskId: task.id,
        listId: task.list_id,
        priority: task.priority,
        dueDate: task.due_date,
        completionTime
      }
    });
  }

  /**
   * Record task uncompleted event
   */
  recordTaskUncompleted(task: Task): void {
    this.recordEvent({
      type: 'task_uncompleted',
      data: {
        taskId: task.id,
        listId: task.list_id,
        priority: task.priority,
        dueDate: task.due_date
      }
    });
  }

  /**
   * Record task deletion event
   */
  recordTaskDeleted(task: Task): void {
    this.recordEvent({
      type: 'task_deleted',
      data: {
        taskId: task.id,
        listId: task.list_id,
        priority: task.priority,
        dueDate: task.due_date
      }
    });
  }

  /**
   * Record list creation event
   */
  recordListCreated(list: List): void {
    this.recordEvent({
      type: 'list_created',
      data: {
        listId: list.id
      }
    });
  }

  /**
   * Record list deletion event
   */
  recordListDeleted(list: List): void {
    this.recordEvent({
      type: 'list_deleted',
      data: {
        listId: list.id
      }
    });
  }

  /**
   * Calculate productivity metrics for a given time period
   */
  calculateMetrics(
    tasks: Task[], 
    lists: List[], 
    filter?: AnalyticsFilter
  ): ProductivityMetrics {
    const filteredTasks = this.filterTasks(tasks, filter);
    const filteredEvents = this.filterEvents(filter);

    const completedTasks = filteredTasks.filter(task => task.completed);
    const totalTasks = filteredTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    const dateRange = filter?.dateRange || {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    };

    const daysDiff = differenceInDays(parseISO(dateRange.end), parseISO(dateRange.start)) + 1;
    const averageTasksPerDay = totalTasks / daysDiff;

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      averageTasksPerDay: Math.round(averageTasksPerDay * 100) / 100,
      totalTasks,
      completedTasks: completedTasks.length,
      priorityDistribution: this.calculatePriorityDistribution(filteredTasks),
      timePatterns: this.calculateTimePatterns(filteredEvents, dateRange),
      streaks: this.calculateStreaks(filteredEvents),
      trends: this.calculateTrends(filteredEvents, dateRange)
    };
  }

  /**
   * Filter tasks based on analytics filter
   */
  private filterTasks(tasks: Task[], filter?: AnalyticsFilter): Task[] {
    if (!filter) return tasks;

    return tasks.filter(task => {
      // Date range filter
      if (filter.dateRange) {
        const taskDate = parseISO(task.created_at);
        const start = parseISO(filter.dateRange.start);
        const end = parseISO(filter.dateRange.end);
        
        if (!isWithinInterval(taskDate, { start, end })) {
          return false;
        }
      }

      // List filter
      if (filter.listIds && filter.listIds.length > 0) {
        if (!filter.listIds.includes(task.list_id)) {
          return false;
        }
      }

      // Priority filter
      if (filter.priorities && filter.priorities.length > 0) {
        if (!filter.priorities.includes(task.priority)) {
          return false;
        }
      }

      // Completion status filter
      if (filter.includeCompleted === false && task.completed) {
        return false;
      }
      if (filter.includeIncomplete === false && !task.completed) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter events based on analytics filter
   */
  private filterEvents(filter?: AnalyticsFilter): AnalyticsEvent[] {
    if (!filter?.dateRange) return this.events;

    const start = parseISO(filter.dateRange.start);
    const end = parseISO(filter.dateRange.end);

    return this.events.filter(event => {
      const eventDate = parseISO(event.timestamp);
      return isWithinInterval(eventDate, { start, end });
    });
  }

  /**
   * Calculate priority distribution
   */
  private calculatePriorityDistribution(tasks: Task[]): PriorityDistribution {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    tasks.forEach(task => {
      distribution[task.priority]++;
    });

    return distribution;
  }

  /**
   * Calculate time patterns for task creation and completion
   */
  private calculateTimePatterns(events: AnalyticsEvent[], dateRange: { start: string; end: string }): TimePattern[] {
    const patterns: Map<string, TimePattern> = new Map();

    events.forEach(event => {
      if (event.type === 'task_created' || event.type === 'task_completed') {
        const date = parseISO(event.timestamp);
        const hour = getHours(date);
        const dayOfWeek = getDay(date);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const key = `${hour}-${dayOfWeek}-${dateStr}`;
        
        if (!patterns.has(key)) {
          patterns.set(key, {
            hour,
            dayOfWeek,
            date: dateStr,
            completionCount: 0,
            creationCount: 0
          });
        }

        const pattern = patterns.get(key)!;
        if (event.type === 'task_completed') {
          pattern.completionCount++;
        } else {
          pattern.creationCount++;
        }
      }
    });

    return Array.from(patterns.values());
  }

  /**
   * Calculate streak data
   */
  private calculateStreaks(events: AnalyticsEvent[]): StreakData {
    const completionEvents = events.filter(event => event.type === 'task_completed');
    const completionDates = new Set(
      completionEvents.map(event => format(parseISO(event.timestamp), 'yyyy-MM-dd'))
    );

    const sortedDates = Array.from(completionDates).sort();
    
    if (sortedDates.length === 0) {
      return {
        current: 0,
        longest: 0,
        lastActivity: null,
        streakDates: []
      };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakDates: string[] = [];
    let longestStreakDates: string[] = [];

    // Check if today or yesterday has activity for current streak
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    let streakStart = -1;
    if (completionDates.has(today)) {
      streakStart = sortedDates.indexOf(today);
    } else if (completionDates.has(yesterday)) {
      streakStart = sortedDates.indexOf(yesterday);
    }

    if (streakStart >= 0) {
      // Calculate current streak backwards from today/yesterday
      for (let i = streakStart; i >= 0; i--) {
        const currentDate = parseISO(sortedDates[i]);
        const expectedDate = subDays(parseISO(sortedDates[streakStart]), streakStart - i);
        
        if (format(currentDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
          currentStreak++;
          currentStreakDates.unshift(sortedDates[i]);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let tempStreak = 1;
    let tempStreakDates = [sortedDates[0]];

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = parseISO(sortedDates[i]);
      const previousDate = parseISO(sortedDates[i - 1]);
      const daysDiff = differenceInDays(currentDate, previousDate);

      if (daysDiff === 1) {
        tempStreak++;
        tempStreakDates.push(sortedDates[i]);
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakDates = [...tempStreakDates];
        }
        tempStreak = 1;
        tempStreakDates = [sortedDates[i]];
      }
    }

    // Check final streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
      longestStreakDates = [...tempStreakDates];
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActivity: sortedDates[sortedDates.length - 1] || null,
      streakDates: currentStreakDates
    };
  }

  /**
   * Calculate trend data
   */
  private calculateTrends(events: AnalyticsEvent[], dateRange: { start: string; end: string }): TrendData {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);

    return {
      daily: this.calculateDailyTrends(events, start, end),
      weekly: this.calculateWeeklyTrends(events, start, end),
      monthly: this.calculateMonthlyTrends(events, start, end)
    };
  }

  /**
   * Calculate daily trends
   */
  private calculateDailyTrends(events: AnalyticsEvent[], start: Date, end: Date): DailyTrend[] {
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEvents = events.filter(event => 
        format(parseISO(event.timestamp), 'yyyy-MM-dd') === dayStr
      );

      const completed = dayEvents.filter(e => e.type === 'task_completed').length;
      const created = dayEvents.filter(e => e.type === 'task_created').length;
      const completionRate = created > 0 ? (completed / created) * 100 : 0;

      return {
        date: dayStr,
        completed,
        created,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });
  }

  /**
   * Calculate weekly trends
   */
  private calculateWeeklyTrends(events: AnalyticsEvent[], start: Date, end: Date): WeeklyTrend[] {
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }); // Monday start
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekEvents = events.filter(event => {
        const eventDate = parseISO(event.timestamp);
        return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
      });

      const completed = weekEvents.filter(e => e.type === 'task_completed').length;
      const created = weekEvents.filter(e => e.type === 'task_created').length;
      const completionRate = created > 0 ? (completed / created) * 100 : 0;
      const averagePerDay = completed / 7;

      return {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        completed,
        created,
        completionRate: Math.round(completionRate * 100) / 100,
        averagePerDay: Math.round(averagePerDay * 100) / 100
      };
    });
  }

  /**
   * Calculate monthly trends
   */
  private calculateMonthlyTrends(events: AnalyticsEvent[], start: Date, end: Date): MonthlyTrend[] {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthEvents = events.filter(event => {
        const eventDate = parseISO(event.timestamp);
        return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
      });

      const completed = monthEvents.filter(e => e.type === 'task_completed').length;
      const created = monthEvents.filter(e => e.type === 'task_created').length;
      const completionRate = created > 0 ? (completed / created) * 100 : 0;
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
      const averagePerDay = completed / daysInMonth;

      return {
        month: format(monthStart, 'MMMM'),
        year: monthStart.getFullYear(),
        completed,
        created,
        completionRate: Math.round(completionRate * 100) / 100,
        averagePerDay: Math.round(averagePerDay * 100) / 100
      };
    });
  }

  /**
   * Get all events (for debugging or export)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    }
  }

  /**
   * Export analytics data
   */
  exportData(): string {
    return JSON.stringify({
      version: ANALYTICS_VERSION,
      events: this.events,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import analytics data
   */
  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version === ANALYTICS_VERSION && Array.isArray(parsed.events)) {
        this.events = parsed.events;
        this.saveEvents();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Lazy-loaded singleton instance to avoid SSR issues
let _analyticsManager: AnalyticsManager | null = null;

export const getAnalyticsManager = (): AnalyticsManager => {
  if (!_analyticsManager) {
    _analyticsManager = new AnalyticsManager();
  }
  return _analyticsManager;
};

// Utility functions for common analytics operations
export const recordTaskCreated = (task: Task) => getAnalyticsManager().recordTaskCreated(task);
export const recordTaskCompleted = (task: Task, completionTime?: number) => 
  getAnalyticsManager().recordTaskCompleted(task, completionTime);
export const recordTaskUncompleted = (task: Task) => getAnalyticsManager().recordTaskUncompleted(task);
export const recordTaskDeleted = (task: Task) => getAnalyticsManager().recordTaskDeleted(task);
export const recordListCreated = (list: List) => getAnalyticsManager().recordListCreated(list);
export const recordListDeleted = (list: List) => getAnalyticsManager().recordListDeleted(list);

export const calculateProductivityMetrics = (
  tasks: Task[], 
  lists: List[], 
  filter?: AnalyticsFilter
): ProductivityMetrics => getAnalyticsManager().calculateMetrics(tasks, lists, filter);