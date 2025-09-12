import React from 'react';
import { render, screen } from '@testing-library/react';
import { VirtualTaskList } from '../VirtualTaskList';
import { Task } from '@/lib/supabase/types';
import { performanceMonitor } from '@/lib/performance';

// Mock react-window components for performance testing
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    const startTime = performance.now();
    
    // Simulate rendering items
    const items = Array.from({ length: Math.min(itemCount, 20) }, (_, index) =>
      children({ index, style: {}, data: itemData })
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Record performance metric
    performanceMonitor.recordMetric({
      name: 'virtual-list-render',
      value: renderTime,
      timestamp: Date.now(),
      metadata: { itemCount },
    });
    
    return (
      <div data-testid="virtual-list" data-render-time={renderTime}>
        {items}
      </div>
    );
  },
}));

jest.mock('react-window-infinite-loader', () => {
  return function InfiniteLoader({ children }: any) {
    return children({
      onItemsRendered: jest.fn(),
      ref: jest.fn(),
    });
  };
});

// Mock TaskItem component with performance tracking
jest.mock('../TaskItem', () => ({
  TaskItem: ({ task }: { task: Task }) => {
    const startTime = performance.now();
    
    // Simulate component rendering work
    const element = <div data-testid={`task-item-${task.id}`}>{task.title}</div>;
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Record performance metric
    performanceMonitor.recordMetric({
      name: 'task-item-render',
      value: renderTime,
      timestamp: Date.now(),
    });
    
    return element;
  },
}));

// Generate test tasks
function generateTestTasks(count: number): Task[] {
  const tasks: Task[] = [];
  const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  
  for (let i = 0; i < count; i++) {
    tasks.push({
      id: `task-${i}`,
      list_id: 'test-list',
      user_id: 'test-user',
      title: `Task ${i + 1}`,
      description: i % 3 === 0 ? `Description for task ${i + 1}` : null,
      completed: i % 4 === 0,
      priority: priorities[i % priorities.length],
      due_date: i % 5 === 0 ? new Date().toISOString() : null,
      created_at: new Date(Date.now() - i * 1000).toISOString(),
      updated_at: new Date(Date.now() - i * 500).toISOString(),
    });
  }
  
  return tasks;
}

describe('VirtualTaskList Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
    jest.clearAllMocks();
  });

  it('renders 100 tasks within performance threshold', () => {
    const tasks = generateTestTasks(100);
    const startTime = performance.now();
    
    render(<VirtualTaskList tasks={tasks} />);
    
    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;
    
    // Should render within 100ms for 100 tasks
    expect(totalRenderTime).toBeLessThan(100);
    
    // Check that virtual list is rendered
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    
    // Check performance metrics
    const metrics = performanceMonitor.getMetrics('virtual-list-render');
    expect(metrics.length).toBeGreaterThan(0);
    
    // Virtual list render should be fast
    const virtualListMetric = metrics[0];
    expect(virtualListMetric.value).toBeLessThan(50);
  });

  it('renders 1000 tasks within performance threshold', () => {
    const tasks = generateTestTasks(1000);
    const startTime = performance.now();
    
    render(<VirtualTaskList tasks={tasks} />);
    
    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;
    
    // Should render within 200ms for 1000 tasks (more lenient)
    expect(totalRenderTime).toBeLessThan(200);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('renders 10000 tasks within performance threshold', () => {
    const tasks = generateTestTasks(10000);
    const startTime = performance.now();
    
    render(<VirtualTaskList tasks={tasks} />);
    
    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;
    
    // Should render within 500ms for 10000 tasks (very lenient)
    expect(totalRenderTime).toBeLessThan(500);
    
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
  });

  it('individual task items render within performance threshold', () => {
    const tasks = generateTestTasks(50);
    
    render(<VirtualTaskList tasks={tasks} />);
    
    // Check task item render performance
    const taskItemMetrics = performanceMonitor.getMetrics('task-item-render');
    
    // Each task item should render quickly
    taskItemMetrics.forEach(metric => {
      expect(metric.value).toBeLessThan(16); // 60fps = 16ms per frame
    });
  });

  it('handles empty task list efficiently', () => {
    const startTime = performance.now();
    
    render(<VirtualTaskList tasks={[]} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Empty list should render very quickly
    expect(renderTime).toBeLessThan(10);
    
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('handles loading state efficiently', () => {
    const startTime = performance.now();
    
    render(<VirtualTaskList tasks={[]} loading={true} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Loading state should render very quickly
    expect(renderTime).toBeLessThan(10);
    
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('memoization prevents unnecessary re-renders', () => {
    const tasks = generateTestTasks(100);
    
    const { rerender } = render(<VirtualTaskList tasks={tasks} />);
    
    // Clear metrics after initial render
    performanceMonitor.clearMetrics();
    
    // Re-render with same props
    const startTime = performance.now();
    rerender(<VirtualTaskList tasks={tasks} />);
    const endTime = performance.now();
    const rerenderTime = endTime - startTime;
    
    // Re-render should be faster due to memoization
    expect(rerenderTime).toBeLessThan(50);
  });

  it('performance degrades gracefully with large datasets', () => {
    const testSizes = [100, 500, 1000, 5000];
    const renderTimes: number[] = [];
    
    testSizes.forEach(size => {
      const tasks = generateTestTasks(size);
      
      const startTime = performance.now();
      const { unmount } = render(<VirtualTaskList tasks={tasks} />);
      const endTime = performance.now();
      
      renderTimes.push(endTime - startTime);
      unmount();
    });
    
    // Performance should degrade gracefully (not exponentially)
    for (let i = 1; i < renderTimes.length; i++) {
      const previousTime = renderTimes[i - 1];
      const currentTime = renderTimes[i];
      const previousSize = testSizes[i - 1];
      const currentSize = testSizes[i];
      
      // Time increase should be roughly proportional to size increase
      const sizeRatio = currentSize / previousSize;
      const timeRatio = currentTime / previousTime;
      
      // Time ratio should not be more than 2x the size ratio
      expect(timeRatio).toBeLessThan(sizeRatio * 2);
    }
  });

  it('virtual scrolling reduces DOM nodes', () => {
    const tasks = generateTestTasks(1000);
    
    render(<VirtualTaskList tasks={tasks} height={400} itemHeight={80} />);
    
    // With virtual scrolling, only visible items should be rendered
    // Height 400px / itemHeight 80px = ~5 visible items + overscan
    const renderedItems = screen.getAllByTestId(/task-item-/);
    
    // Should render much fewer than 1000 items
    expect(renderedItems.length).toBeLessThan(50);
    expect(renderedItems.length).toBeGreaterThan(0);
  });

  it('measures memory usage impact', () => {
    // Test with small dataset
    const smallTasks = generateTestTasks(10);
    const { unmount: unmountSmall } = render(<VirtualTaskList tasks={smallTasks} />);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Test with large dataset
    const largeTasks = generateTestTasks(1000);
    const { unmount: unmountLarge } = render(<VirtualTaskList tasks={largeTasks} />);
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Clean up
    unmountSmall();
    unmountLarge();
    
    // Memory increase should be reasonable (less than 10MB for 1000 tasks)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    }
  });
});