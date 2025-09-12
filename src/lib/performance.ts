/**
 * Performance monitoring utilities for tracking app performance
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  taskListRender: number; // ms
  taskItemRender: number; // ms
  databaseQuery: number; // ms
  bundleSize: number; // bytes
  memoryUsage: number; // bytes
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds = {
    taskListRender: 100, // 100ms
    taskItemRender: 16, // 16ms (60fps)
    databaseQuery: 500, // 500ms
    bundleSize: 1024 * 1024, // 1MB
    memoryUsage: 50 * 1024 * 1024, // 50MB
  };

  /**
   * Start measuring performance for a specific operation
   */
  startMeasure(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
      });
      
      return duration;
    };
  }

  /**
   * Measure the performance of an async function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endMeasure = this.startMeasure(name);
    try {
      const result = await fn();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }

  /**
   * Measure the performance of a synchronous function
   */
  measureSync<T>(name: string, fn: () => T): T {
    const endMeasure = this.startMeasure(name);
    try {
      const result = fn();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Check against thresholds
    this.checkThreshold(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average performance for a metric
   */
  getAveragePerformance(name: string, timeWindow?: number): number {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const relevantMetrics = this.metrics.filter(
      metric => metric.name === name && metric.timestamp >= windowStart
    );
    
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  /**
   * Check if a metric exceeds threshold and log warning
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.getThreshold(metric.name);
    if (threshold && metric.value > threshold) {
      console.warn(
        `Performance threshold exceeded for ${metric.name}: ${metric.value.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Get threshold for a specific metric
   */
  private getThreshold(metricName: string): number | null {
    const thresholdMap: Record<string, keyof PerformanceThresholds> = {
      'task-list-render': 'taskListRender',
      'task-item-render': 'taskItemRender',
      'database-query': 'databaseQuery',
      'bundle-size': 'bundleSize',
      'memory-usage': 'memoryUsage',
    };
    
    const thresholdKey = thresholdMap[metricName];
    return thresholdKey ? this.thresholds[thresholdKey] : null;
  }

  /**
   * Update performance thresholds
   */
  setThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    const metricNames = [...new Set(this.metrics.map(m => m.name))];
    
    metricNames.forEach(name => {
      const metrics = this.getMetrics(name);
      const values = metrics.map(m => m.value);
      
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });
    
    return summary;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const measureRender = (fn: () => void) => {
    return performanceMonitor.measureSync(`${componentName}-render`, fn);
  };

  const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsync(`${componentName}-${name}`, fn);
  };

  return {
    measureRender,
    measureAsync,
    recordMetric: (name: string, value: number, metadata?: Record<string, any>) => {
      performanceMonitor.recordMetric({
        name: `${componentName}-${name}`,
        value,
        timestamp: Date.now(),
        metadata,
      });
    },
  };
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    
    if (!originalMethod) return descriptor;
    
    descriptor.value = function (this: any, ...args: any[]) {
      return performanceMonitor.measureSync(name, () => originalMethod.apply(this, args));
    } as T;
    
    return descriptor;
  };
}

/**
 * Measure Web Vitals and other browser performance metrics
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Measure Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      performanceMonitor.recordMetric({
        name: 'web-vitals-lcp',
        value: lastEntry.startTime,
        timestamp: Date.now(),
      });
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }
  }

  // Measure First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        performanceMonitor.recordMetric({
          name: 'web-vitals-fid',
          value: entry.processingStart - entry.startTime,
          timestamp: Date.now(),
        });
      });
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }
  }

  // Measure memory usage
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory;
    performanceMonitor.recordMetric({
      name: 'memory-usage',
      value: memoryInfo.usedJSHeapSize,
      timestamp: Date.now(),
      metadata: {
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      },
    });
  }
}

/**
 * Monitor bundle size and loading performance
 */
export function measureBundlePerformance() {
  if (typeof window === 'undefined') return;

  // Measure navigation timing
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      performanceMonitor.recordMetric({
        name: 'page-load-time',
        value: navigation.loadEventEnd - navigation.startTime,
        timestamp: Date.now(),
      });
      
      performanceMonitor.recordMetric({
        name: 'dom-content-loaded',
        value: navigation.domContentLoadedEventEnd - navigation.startTime,
        timestamp: Date.now(),
      });
    }
  }

  // Measure resource loading
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        performanceMonitor.recordMetric({
          name: 'resource-load-time',
          value: resource.responseEnd - resource.startTime,
          timestamp: Date.now(),
          metadata: {
            name: resource.name,
            size: resource.transferSize,
            type: resource.name.includes('.js') ? 'javascript' : 'css',
          },
        });
      }
    });
  }
}