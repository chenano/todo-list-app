import type { Task, List } from '@/types';

/**
 * Utility functions for generating test data at scale
 */

export interface TaskGeneratorOptions {
  count: number;
  listId?: string;
  userId?: string;
  completionRate?: number; // 0-1, percentage of tasks that should be completed
  priorityDistribution?: {
    high: number;
    medium: number;
    low: number;
  };
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  titlePrefix?: string;
  includeDescriptions?: boolean;
}

export interface ListGeneratorOptions {
  count: number;
  userId?: string;
  namePrefix?: string;
  includeDescriptions?: boolean;
  taskCounts?: {
    min: number;
    max: number;
  };
}

/**
 * Generate a large number of tasks for performance testing
 */
export function generateTasks(options: TaskGeneratorOptions): Task[] {
  const {
    count,
    listId = 'test-list-1',
    userId = 'test-user-1',
    completionRate = 0.3,
    priorityDistribution = { high: 0.2, medium: 0.5, low: 0.3 },
    dueDateRange,
    titlePrefix = 'Test Task',
    includeDescriptions = true,
  } = options;

  const tasks: Task[] = [];
  const priorities: Array<'high' | 'medium' | 'low'> = [];

  // Pre-calculate priority distribution
  const highCount = Math.floor(count * priorityDistribution.high);
  const mediumCount = Math.floor(count * priorityDistribution.medium);
  const lowCount = count - highCount - mediumCount;

  priorities.push(...Array(highCount).fill('high'));
  priorities.push(...Array(mediumCount).fill('medium'));
  priorities.push(...Array(lowCount).fill('low'));

  // Shuffle priorities
  for (let i = priorities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [priorities[i], priorities[j]] = [priorities[j], priorities[i]];
  }

  for (let i = 0; i < count; i++) {
    const isCompleted = Math.random() < completionRate;
    const priority = priorities[i] || 'medium';
    
    let dueDate: string | null = null;
    if (dueDateRange && Math.random() < 0.7) { // 70% chance of having due date
      const start = dueDateRange.start.getTime();
      const end = dueDateRange.end.getTime();
      const randomTime = start + Math.random() * (end - start);
      dueDate = new Date(randomTime).toISOString().split('T')[0];
    }

    const baseDate = new Date(2024, 0, 1);
    const createdAt = new Date(baseDate.getTime() + i * 60000); // 1 minute apart
    const updatedAt = isCompleted 
      ? new Date(createdAt.getTime() + Math.random() * 86400000) // Random time after creation
      : createdAt;

    tasks.push({
      id: `task-${i + 1}`,
      list_id: Array.isArray(listId) ? listId[i % listId.length] : listId,
      user_id: userId,
      title: `${titlePrefix} ${i + 1}`,
      description: includeDescriptions 
        ? `This is a detailed description for ${titlePrefix.toLowerCase()} ${i + 1}. It contains various information about the task and its requirements.`
        : undefined,
      completed: isCompleted,
      priority,
      due_date: dueDate,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });
  }

  return tasks;
}

/**
 * Generate a large number of lists for performance testing
 */
export function generateLists(options: ListGeneratorOptions): List[] {
  const {
    count,
    userId = 'test-user-1',
    namePrefix = 'Test List',
    includeDescriptions = true,
  } = options;

  const lists: List[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(2024, 0, 1 + i); // One day apart

    lists.push({
      id: `list-${i + 1}`,
      user_id: userId,
      name: `${namePrefix} ${i + 1}`,
      description: includeDescriptions 
        ? `Description for ${namePrefix.toLowerCase()} ${i + 1}. This list contains various tasks and items.`
        : undefined,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }

  return lists;
}

/**
 * Generate realistic task data with patterns
 */
export function generateRealisticTasks(count: number): Task[] {
  const taskPatterns = [
    { prefix: 'Review', priority: 'medium', completionRate: 0.8 },
    { prefix: 'Fix bug', priority: 'high', completionRate: 0.6 },
    { prefix: 'Implement', priority: 'medium', completionRate: 0.4 },
    { prefix: 'Research', priority: 'low', completionRate: 0.7 },
    { prefix: 'Meeting with', priority: 'medium', completionRate: 0.9 },
    { prefix: 'Update', priority: 'low', completionRate: 0.8 },
    { prefix: 'Create', priority: 'medium', completionRate: 0.5 },
    { prefix: 'Test', priority: 'high', completionRate: 0.7 },
  ];

  const tasks: Task[] = [];

  for (let i = 0; i < count; i++) {
    const pattern = taskPatterns[i % taskPatterns.length];
    const isCompleted = Math.random() < pattern.completionRate;
    
    // Generate realistic due dates
    let dueDate: string | null = null;
    if (Math.random() < 0.6) { // 60% have due dates
      const daysFromNow = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      dueDate = date.toISOString().split('T')[0];
    }

    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const updatedAt = isCompleted 
      ? new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()))
      : createdAt;

    tasks.push({
      id: `realistic-task-${i + 1}`,
      list_id: `list-${Math.floor(i / 20) + 1}`, // 20 tasks per list
      user_id: 'test-user-1',
      title: `${pattern.prefix} ${generateTaskSuffix(pattern.prefix)}`,
      description: generateTaskDescription(pattern.prefix),
      completed: isCompleted,
      priority: pattern.priority as 'low' | 'medium' | 'high',
      due_date: dueDate,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });
  }

  return tasks;
}

function generateTaskSuffix(prefix: string): string {
  const suffixes: Record<string, string[]> = {
    'Review': ['pull request #123', 'documentation', 'code changes', 'design mockups'],
    'Fix bug': ['in user authentication', 'with data loading', 'in mobile layout', 'with form validation'],
    'Implement': ['user dashboard', 'search functionality', 'data export', 'notification system'],
    'Research': ['new technologies', 'competitor analysis', 'user feedback', 'performance optimization'],
    'Meeting with': ['design team', 'stakeholders', 'development team', 'product manager'],
    'Update': ['dependencies', 'documentation', 'test cases', 'deployment scripts'],
    'Create': ['user guide', 'API documentation', 'test plan', 'deployment pipeline'],
    'Test': ['new features', 'bug fixes', 'performance', 'accessibility'],
  };

  const options = suffixes[prefix] || ['item'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateTaskDescription(prefix: string): string {
  const descriptions: Record<string, string[]> = {
    'Review': [
      'Carefully examine the changes and provide feedback on code quality, performance, and adherence to standards.',
      'Check for any potential issues, security vulnerabilities, and ensure proper testing coverage.',
    ],
    'Fix bug': [
      'Investigate the root cause of the issue and implement a comprehensive solution.',
      'Ensure the fix doesn\'t introduce new problems and add appropriate test coverage.',
    ],
    'Implement': [
      'Design and develop the feature according to specifications and best practices.',
      'Include proper error handling, validation, and user experience considerations.',
    ],
    'Research': [
      'Gather comprehensive information and analyze different approaches to the problem.',
      'Document findings and provide recommendations for the best path forward.',
    ],
    'Meeting with': [
      'Discuss project progress, address any blockers, and align on next steps.',
      'Prepare agenda items and ensure all stakeholders are informed of decisions.',
    ],
    'Update': [
      'Ensure all components are current and compatible with the latest requirements.',
      'Test thoroughly after updates to prevent any regression issues.',
    ],
    'Create': [
      'Develop comprehensive and user-friendly documentation with clear examples.',
      'Ensure content is accurate, up-to-date, and accessible to the target audience.',
    ],
    'Test': [
      'Execute thorough testing procedures to ensure quality and reliability.',
      'Document test results and report any issues found during the testing process.',
    ],
  };

  const options = descriptions[prefix] || ['Complete this task according to requirements.'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate performance test dataset with specific characteristics
 */
export function generatePerformanceTestData() {
  return {
    // Small dataset for baseline
    small: {
      lists: generateLists({ count: 5 }),
      tasks: generateTasks({ count: 50 }),
    },
    
    // Medium dataset for typical usage
    medium: {
      lists: generateLists({ count: 20 }),
      tasks: generateTasks({ count: 500 }),
    },
    
    // Large dataset for stress testing
    large: {
      lists: generateLists({ count: 100 }),
      tasks: generateTasks({ count: 5000 }),
    },
    
    // Extra large dataset for extreme testing
    extraLarge: {
      lists: generateLists({ count: 500 }),
      tasks: generateTasks({ count: 50000 }),
    },
  };
}

/**
 * Generate search test data with specific patterns
 */
export function generateSearchTestData(): Task[] {
  const searchTerms = [
    'urgent', 'important', 'meeting', 'review', 'bug', 'feature',
    'documentation', 'test', 'deploy', 'update', 'fix', 'implement'
  ];

  const tasks: Task[] = [];

  searchTerms.forEach((term, index) => {
    // Create tasks with the term in title
    tasks.push({
      id: `search-title-${index}`,
      list_id: 'search-list',
      user_id: 'test-user',
      title: `${term} related task`,
      description: 'This task is for search testing purposes.',
      completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create tasks with the term in description
    tasks.push({
      id: `search-desc-${index}`,
      list_id: 'search-list',
      user_id: 'test-user',
      title: 'Search test task',
      description: `This task contains the term ${term} in its description for testing search functionality.`,
      completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return tasks;
}

/**
 * Generate accessibility test data
 */
export function generateAccessibilityTestData(): Task[] {
  return [
    {
      id: 'a11y-1',
      list_id: 'a11y-list',
      user_id: 'test-user',
      title: 'Task with special characters: àáâãäåæçèéêë',
      description: 'Testing unicode and special character support',
      completed: false,
      priority: 'high',
      due_date: '2024-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a11y-2',
      list_id: 'a11y-list',
      user_id: 'test-user',
      title: 'Very long task title that should wrap properly and maintain readability across different screen sizes and zoom levels',
      description: 'This task has an extremely long title to test how the interface handles text wrapping and maintains accessibility at different zoom levels and screen sizes.',
      completed: true,
      priority: 'low',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a11y-3',
      list_id: 'a11y-list',
      user_id: 'test-user',
      title: 'Task with emoji 🚀 📝 ✅ 🎯',
      description: 'Testing emoji support and screen reader compatibility',
      completed: false,
      priority: 'medium',
      due_date: '2024-01-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}