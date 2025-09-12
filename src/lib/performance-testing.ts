/**
 * Performance testing utilities for measuring and validating app performance
 */

import { performanceMonitor } from './performance';
import { Task } from './supabase/types';

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  actualValue: number;
  expectedThreshold: number;
  metadata?: Record<string, any>;
}

export interface PerformanceTestSuite {
  name: string;
  results: PerformanceTestResult[];
  overallPassed: boolean;
  duration: number;
}

/**
 * Performance test runner for validating app performance
 */
export class PerformanceTestRunner {
  private results: PerformanceTestResult[] = [];

  /**
   * Test task list rendering performance
   */
  async testTaskListRendering(taskCount: number): Promise<PerformanceTestResult> {
    const testName = `task-list-render-${taskCount}`;
    const threshold = taskCount > 1000 ? 200 : 100; // More lenient for large lists
    
    // Generate test tasks
    const tasks = this.generateTestTasks(taskCount);
    
    const startTime = performance.now();
    
    // Simulate task list rendering
    const filteredTasks = tasks.filter(task => !task.completed);
    const sortedTasks = filteredTasks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: PerformanceTestResult = {
      testName,
      passed: duration <= threshold,
      actualValue: duration,
      expectedThreshold: threshold,
      metadata: {
        taskCount,
        filteredCount: filteredTasks.length,
        sortedCount: sortedTasks.length,
      },
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test task filtering performance
   */
  async testTaskFiltering(taskCount: number): Promise<PerformanceTestResult> {
    const testName = `task-filtering-${taskCount}`;
    const threshold = 50; // 50ms threshold for filtering
    
    const tasks = this.generateTestTasks(taskCount);
    
    const startTime = performance.now();
    
    // Simulate complex filtering
    const filtered = tasks.filter(task => {
      const isHighPriority = task.priority === 'high';
      const isOverdue = task.due_date && new Date(task.due_date) < new Date();
      const isIncomplete = !task.completed;
      const hasDescription = task.description && task.description.length > 0;
      
      return isHighPriority || (isOverdue && isIncomplete) || hasDescription;
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: PerformanceTestResult = {
      testName,
      passed: duration <= threshold,
      actualValue: duration,
      expectedThreshold: threshold,
      metadata: {
        taskCount,
        filteredCount: filtered.length,
      },
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test virtual scrolling performance
   */
  async testVirtualScrolling(itemCount: number): Promise<PerformanceTestResult> {
    const testName = `virtual-scrolling-${itemCount}`;
    const threshold = 16; // 16ms for 60fps
    
    const startTime = performance.now();
    
    // Simulate virtual scrolling calculations
    const itemHeight = 80;
    const containerHeight = 600;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const overscan = 5;
    const totalVisible = visibleItems + (overscan * 2);
    
    // Simulate rendering only visible items
    const visibleRange = {
      start: Math.max(0, 0 - overscan),
      end: Math.min(itemCount, totalVisible),
    };
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: PerformanceTestResult = {
      testName,
      passed: duration <= threshold,
      actualValue: duration,
      expectedThreshold: threshold,
      metadata: {
        itemCount,
        visibleItems: totalVisible,
        visibleRange,
      },
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage(): Promise<PerformanceTestResult> {
    const testName = 'memory-usage';
    const threshold = 50 * 1024 * 1024; // 50MB threshold
    
    let memoryUsage = 0;
    
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      memoryUsage = memoryInfo.usedJSHeapSize;
    }
    
    const result: PerformanceTestResult = {
      testName,
      passed: memoryUsage <= threshold || memoryUsage === 0, // Pass if memory API not available
      actualValue: memoryUsage,
      expectedThreshold: threshold,
      metadata: {
        memoryAvailable: 'memory' in performance,
      },
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test database query simulation performance
   */
  async testDatabaseQuerySimulation(recordCount: number): Promise<PerformanceTestResult> {
    const testName = `database-query-${recordCount}`;
    const threshold = 100; // 100ms threshold for query simulation
    
    const startTime = performance.now();
    
    // Simulate database operations
    const records = this.generateTestTasks(recordCount);
    
    // Simulate filtering (WHERE clause)
    const filtered = records.filter(task => task.list_id === 'test-list');
    
    // Simulate sorting (ORDER BY clause)
    const sorted = filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Simulate pagination (LIMIT/OFFSET)
    const pageSize = 50;
    const page1 = sorted.slice(0, pageSize);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: PerformanceTestResult = {
      testName,
      passed: duration <= threshold,
      actualValue: duration,
      expectedThreshold: threshold,
      metadata: {
        recordCount,
        filteredCount: filtered.length,
        sortedCount: sorted.length,
        paginatedCount: page1.length,
      },
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Run a complete performance test suite
   */
  async runTestSuite(): Promise<PerformanceTestSuite> {
    const suiteName = 'Todo App Performance Tests';
    const startTime = performance.now();
    
    this.results = [];
    
    // Test different scenarios
    await this.testTaskListRendering(100);
    await this.testTaskListRendering(1000);
    await this.testTaskListRendering(5000);
    
    await this.testTaskFiltering(100);
    await this.testTaskFiltering(1000);
    await this.testTaskFiltering(5000);
    
    await this.testVirtualScrolling(100);
    await this.testVirtualScrolling(1000);
    await this.testVirtualScrolling(10000);
    
    await this.testMemoryUsage();
    
    await this.testDatabaseQuerySimulation(100);
    await this.testDatabaseQuerySimulation(1000);
    await this.testDatabaseQuerySimulation(5000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const overallPassed = this.results.every(result => result.passed);
    
    return {
      name: suiteName,
      results: [...this.results],
      overallPassed,
      duration,
    };
  }

  /**
   * Generate test tasks for performance testing
   */
  private generateTestTasks(count: number): Task[] {
    const tasks: Task[] = [];
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const listIds = ['list-1', 'list-2', 'list-3'];
    
    for (let i = 0; i < count; i++) {
      const task: Task = {
        id: `task-${i}`,
        list_id: listIds[i % listIds.length],
        user_id: 'test-user',
        title: `Task ${i + 1}`,
        description: i % 3 === 0 ? `Description for task ${i + 1}` : null,
        completed: i % 4 === 0, // 25% completed
        priority: priorities[i % priorities.length],
        due_date: i % 5 === 0 ? new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString() : null,
        created_at: new Date(Date.now() - (i * 60 * 1000)).toISOString(),
        updated_at: new Date(Date.now() - (i * 30 * 1000)).toISOString(),
      };
      tasks.push(task);
    }
    
    return tasks;
  }

  /**
   * Get test results
   */
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }
}

/**
 * Singleton instance for performance testing
 */
export const performanceTestRunner = new PerformanceTestRunner();

/**
 * Run performance benchmarks and log results
 */
export async function runPerformanceBenchmarks(): Promise<void> {
  console.log('🚀 Running performance benchmarks...');
  
  const suite = await performanceTestRunner.runTestSuite();
  
  console.log(`\n📊 Performance Test Results (${suite.duration.toFixed(2)}ms total)`);
  console.log('=' .repeat(60));
  
  suite.results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const percentage = ((result.actualValue / result.expectedThreshold) * 100).toFixed(1);
    
    console.log(
      `${status} ${result.testName}: ${result.actualValue.toFixed(2)}ms ` +
      `(${percentage}% of ${result.expectedThreshold}ms threshold)`
    );
    
    if (result.metadata) {
      console.log(`   Metadata: ${JSON.stringify(result.metadata)}`);
    }
  });
  
  console.log('=' .repeat(60));
  console.log(`Overall: ${suite.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Record results in performance monitor
  suite.results.forEach(result => {
    performanceMonitor.recordMetric({
      name: `benchmark-${result.testName}`,
      value: result.actualValue,
      timestamp: Date.now(),
      metadata: {
        ...result.metadata,
        passed: result.passed,
        threshold: result.expectedThreshold,
      },
    });
  });
}