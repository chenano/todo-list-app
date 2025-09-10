// Performance monitoring utilities

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  bundleSize?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure page load time
  measurePageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.updateMetrics(pageName, { loadTime });
    }
  }

  // Measure component render time
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.updateMetrics(componentName, { renderTime });
    return result;
  }

  // Measure interaction response time
  async measureInteraction<T>(actionName: string, actionFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await actionFn();
    const endTime = performance.now();
    const interactionTime = endTime - startTime;
    
    this.updateMetrics(actionName, { interactionTime });
    return result;
  }

  // Update metrics for a given key
  private updateMetrics(key: string, newMetrics: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(key) || { loadTime: 0, renderTime: 0, interactionTime: 0 };
    this.metrics.set(key, { ...existing, ...newMetrics });
  }

  // Get metrics for a specific key
  getMetrics(key: string): PerformanceMetrics | undefined {
    return this.metrics.get(key);
  }

  // Get all metrics
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  // Log performance summary
  logSummary(): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;

    console.group('🚀 Performance Summary');
    this.metrics.forEach((metrics, key) => {
      console.log(`📊 ${key}:`, {
        'Load Time': `${metrics.loadTime.toFixed(2)}ms`,
        'Render Time': `${metrics.renderTime.toFixed(2)}ms`,
        'Interaction Time': `${metrics.interactionTime.toFixed(2)}ms`,
      });
    });
    console.groupEnd();
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function for performance optimization
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance optimization
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure Web Vitals
  measureWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('🎯 LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        console.log('⚡ FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('📐 CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  },

  // Preload critical resources
  preloadResource(href: string, as: string): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Lazy load images
  lazyLoadImage(img: HTMLImageElement): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            image.src = image.dataset.src || '';
            image.classList.remove('lazy');
            observer.unobserve(image);
          }
        });
      });
      observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      img.src = img.dataset.src || '';
    }
  },
};

// Performance monitoring hook
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  return {
    measureRender: monitor.measureRender.bind(monitor),
    measureInteraction: monitor.measureInteraction.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    logSummary: monitor.logSummary.bind(monitor),
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();