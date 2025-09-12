import { performanceMonitor, usePerformanceMonitor, measurePerformance } from '../performance';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
    mockPerformanceNow.mockClear();
    jest.clearAllMocks();
  });

  describe('startMeasure', () => {
    it('measures execution time', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      const endMeasure = performanceMonitor.startMeasure('test-operation');
      const duration = endMeasure();
      
      expect(duration).toBe(50);
      
      const metrics = performanceMonitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(50);
      expect(metrics[0].name).toBe('test-operation');
    });
  });

  describe('measureAsync', () => {
    it('measures async function execution time', async () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(200);
      
      const asyncFn = jest.fn().mockResolvedValue('result');
      
      const result = await performanceMonitor.measureAsync('async-test', asyncFn);
      
      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalled();
      
      const metrics = performanceMonitor.getMetrics('async-test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
    });

    it('measures async function that throws error', async () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      const asyncFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        performanceMonitor.measureAsync('async-error', asyncFn)
      ).rejects.toThrow('Test error');
      
      const metrics = performanceMonitor.getMetrics('async-error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(50);
    });
  });

  describe('measureSync', () => {
    it('measures sync function execution time', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(120);
      
      const syncFn = jest.fn().mockReturnValue('result');
      
      const result = performanceMonitor.measureSync('sync-test', syncFn);
      
      expect(result).toBe('result');
      expect(syncFn).toHaveBeenCalled();
      
      const metrics = performanceMonitor.getMetrics('sync-test');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(20);
    });

    it('measures sync function that throws error', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(130);
      
      const syncFn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      expect(() => 
        performanceMonitor.measureSync('sync-error', syncFn)
      ).toThrow('Test error');
      
      const metrics = performanceMonitor.getMetrics('sync-error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(30);
    });
  });

  describe('recordMetric', () => {
    it('records a metric', () => {
      const metric = {
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
        metadata: { test: true },
      };
      
      performanceMonitor.recordMetric(metric);
      
      const metrics = performanceMonitor.getMetrics('test-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('limits metrics to 1000 entries', () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceMonitor.recordMetric({
          name: 'test-metric',
          value: i,
          timestamp: Date.now(),
        });
      }
      
      const allMetrics = performanceMonitor.getMetrics();
      expect(allMetrics).toHaveLength(1000);
      
      // Should keep the last 1000 metrics
      expect(allMetrics[0].value).toBe(1);
      expect(allMetrics[999].value).toBe(1000);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      performanceMonitor.recordMetric({
        name: 'metric-1',
        value: 100,
        timestamp: Date.now(),
      });
      performanceMonitor.recordMetric({
        name: 'metric-2',
        value: 200,
        timestamp: Date.now(),
      });
      performanceMonitor.recordMetric({
        name: 'metric-1',
        value: 150,
        timestamp: Date.now(),
      });
    });

    it('returns all metrics when no name specified', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('returns filtered metrics by name', () => {
      const metrics = performanceMonitor.getMetrics('metric-1');
      expect(metrics).toHaveLength(2);
      expect(metrics.every(m => m.name === 'metric-1')).toBe(true);
    });
  });

  describe('getAveragePerformance', () => {
    beforeEach(() => {
      const baseTime = Date.now();
      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: baseTime - 1000,
      });
      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 200,
        timestamp: baseTime - 500,
      });
      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 300,
        timestamp: baseTime,
      });
    });

    it('calculates average for all metrics', () => {
      const average = performanceMonitor.getAveragePerformance('test-metric');
      expect(average).toBe(200); // (100 + 200 + 300) / 3
    });

    it('calculates average within time window', () => {
      const average = performanceMonitor.getAveragePerformance('test-metric', 600);
      expect(average).toBe(250); // (200 + 300) / 2
    });

    it('returns 0 for non-existent metric', () => {
      const average = performanceMonitor.getAveragePerformance('non-existent');
      expect(average).toBe(0);
    });
  });

  describe('getSummary', () => {
    beforeEach(() => {
      performanceMonitor.recordMetric({
        name: 'metric-1',
        value: 100,
        timestamp: Date.now(),
      });
      performanceMonitor.recordMetric({
        name: 'metric-1',
        value: 200,
        timestamp: Date.now(),
      });
      performanceMonitor.recordMetric({
        name: 'metric-2',
        value: 50,
        timestamp: Date.now(),
      });
    });

    it('returns summary for all metrics', () => {
      const summary = performanceMonitor.getSummary();
      
      expect(summary['metric-1']).toEqual({
        avg: 150,
        min: 100,
        max: 200,
        count: 2,
      });
      
      expect(summary['metric-2']).toEqual({
        avg: 50,
        min: 50,
        max: 50,
        count: 1,
      });
    });
  });

  describe('threshold checking', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs warning when threshold is exceeded', () => {
      performanceMonitor.recordMetric({
        name: 'task-list-render',
        value: 150, // Exceeds default threshold of 100ms
        timestamp: Date.now(),
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded for task-list-render: 150.00ms (threshold: 100ms)')
      );
    });

    it('does not log warning when threshold is not exceeded', () => {
      performanceMonitor.recordMetric({
        name: 'task-list-render',
        value: 50, // Below threshold
        timestamp: Date.now(),
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('allows updating thresholds', () => {
      performanceMonitor.setThresholds({
        taskListRender: 200,
      });
      
      performanceMonitor.recordMetric({
        name: 'task-list-render',
        value: 150, // Now below new threshold
        timestamp: Date.now(),
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearMetrics', () => {
    it('clears all metrics', () => {
      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });
      
      expect(performanceMonitor.getMetrics()).toHaveLength(1);
      
      performanceMonitor.clearMetrics();
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });
});

describe('measurePerformance decorator', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
    mockPerformanceNow.mockClear();
  });

  it('measures method performance', () => {
    mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
    
    class TestClass {
      @measurePerformance('test-method')
      testMethod(value: number) {
        return value * 2;
      }
    }
    
    const instance = new TestClass();
    const result = instance.testMethod(5);
    
    expect(result).toBe(10);
    
    const metrics = performanceMonitor.getMetrics('test-method');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBe(50);
  });
});

// Note: usePerformanceMonitor would need to be tested in a React testing environment
// with renderHook from @testing-library/react-hooks