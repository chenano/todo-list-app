import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and ensure user is logged in
    await page.goto('/');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load Performance', () => {
    test('should load dashboard within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: Record<string, number> = {};
            
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
              if (entry.name === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
            });
            
            resolve(vitals);
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      console.log('Performance metrics:', metrics);
    });

    test('should have acceptable First Contentful Paint', async ({ page }) => {
      await page.goto('/dashboard');
      
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            resolve(fcpEntry ? fcpEntry.startTime : null);
          }).observe({ entryTypes: ['paint'] });
          
          setTimeout(() => resolve(null), 3000);
        });
      });
      
      if (fcp) {
        // FCP should be under 1.8 seconds (good threshold)
        expect(fcp).toBeLessThan(1800);
      }
    });

    test('should have acceptable Largest Contentful Paint', async ({ page }) => {
      await page.goto('/dashboard');
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcpEntry = entries[entries.length - 1]; // Latest LCP
            resolve(lcpEntry ? lcpEntry.startTime : null);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      if (lcp) {
        // LCP should be under 2.5 seconds (good threshold)
        expect(lcp).toBeLessThan(2500);
      }
    });

    test('should have minimal Cumulative Layout Shift', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      // CLS should be under 0.1 (good threshold)
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Interaction Performance', () => {
    test('should respond to task creation quickly', async ({ page }) => {
      const startTime = performance.now();
      
      await page.click('[data-testid="add-task-button"]');
      await page.waitForSelector('[data-testid="task-form"]');
      
      const responseTime = performance.now() - startTime;
      
      // Should respond within 100ms
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle search input responsively', async ({ page }) => {
      await page.keyboard.press('Control+k');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      
      const startTime = performance.now();
      await searchInput.type('test query');
      const responseTime = performance.now() - startTime;
      
      // Should handle typing within 50ms per character
      expect(responseTime).toBeLessThan(50 * 'test query'.length);
    });

    test('should switch themes quickly', async ({ page }) => {
      const startTime = performance.now();
      
      await page.click('[data-testid="theme-toggle"]');
      
      // Wait for theme to apply
      await page.waitForFunction(() => {
        return document.documentElement.classList.contains('dark') || 
               !document.documentElement.classList.contains('dark');
      });
      
      const switchTime = performance.now() - startTime;
      
      // Theme switch should complete within 200ms
      expect(switchTime).toBeLessThan(200);
    });

    test('should handle bulk selection efficiently', async ({ page }) => {
      // Create multiple tasks first
      for (let i = 1; i <= 10; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Performance task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      const startTime = performance.now();
      
      // Select all tasks
      await page.keyboard.press('Control+a');
      
      // Wait for bulk action bar to appear
      await page.waitForSelector('[data-testid="bulk-action-bar"]');
      
      const selectionTime = performance.now() - startTime;
      
      // Bulk selection should complete within 300ms
      expect(selectionTime).toBeLessThan(300);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render large task lists efficiently', async ({ page }) => {
      // Mock large dataset
      await page.evaluate(() => {
        const mockTasks = Array.from({ length: 1000 }, (_, i) => ({
          id: `task-${i}`,
          title: `Performance test task ${i}`,
          completed: i % 4 === 0,
          priority: ['low', 'medium', 'high'][i % 3],
        }));
        
        // Store in localStorage to simulate large dataset
        localStorage.setItem('mock-large-dataset', JSON.stringify(mockTasks));
      });
      
      const startTime = performance.now();
      
      // Trigger rendering of large list
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const renderTime = performance.now() - startTime;
      
      // Should render large list within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    test('should handle rapid UI updates efficiently', async ({ page }) => {
      // Create a task
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Rapid update task');
      await page.click('button[type="submit"]');
      
      const startTime = performance.now();
      
      // Perform rapid updates
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="task-checkbox"]');
        await page.waitForTimeout(10); // Small delay between updates
      }
      
      const updateTime = performance.now() - startTime;
      
      // Rapid updates should complete within 1 second
      expect(updateTime).toBeLessThan(1000);
    });

    test('should scroll smoothly through virtual lists', async ({ page }) => {
      // Mock large dataset for virtual scrolling
      await page.evaluate(() => {
        const mockTasks = Array.from({ length: 5000 }, (_, i) => ({
          id: `scroll-task-${i}`,
          title: `Scroll test task ${i}`,
          completed: false,
        }));
        
        localStorage.setItem('mock-scroll-dataset', JSON.stringify(mockTasks));
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const taskList = page.locator('[data-testid="virtual-task-list"]');
      
      const startTime = performance.now();
      
      // Perform scrolling
      for (let i = 0; i < 10; i++) {
        await taskList.evaluate((el, scrollTop) => {
          el.scrollTop = scrollTop;
        }, i * 500);
        await page.waitForTimeout(50);
      }
      
      const scrollTime = performance.now() - startTime;
      
      // Scrolling should be smooth (under 1 second for 10 scroll operations)
      expect(scrollTime).toBeLessThan(1000);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/dashboard');
        await page.goto('/dashboard/analytics');
        await page.goto('/dashboard/search');
        await page.goto('/dashboard');
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be less than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });

    test('should handle large datasets without excessive memory usage', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Create large dataset
      await page.evaluate(() => {
        const largeTasks = Array.from({ length: 10000 }, (_, i) => ({
          id: `memory-task-${i}`,
          title: `Memory test task ${i}`,
          description: `Description for task ${i}`.repeat(10),
          completed: i % 4 === 0,
        }));
        
        localStorage.setItem('large-memory-dataset', JSON.stringify(largeTasks));
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 100MB)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        await route.continue();
      });
      
      const startTime = performance.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = performance.now() - startTime;
      
      // Should still load within reasonable time on slow network (10 seconds)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should cache resources effectively', async ({ page }) => {
      // First load
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Second load (should use cache)
      const startTime = performance.now();
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const reloadTime = performance.now() - startTime;
      
      // Cached reload should be faster (under 1 second)
      expect(reloadTime).toBeLessThan(1000);
    });

    test('should handle offline mode efficiently', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      const startTime = performance.now();
      
      // Try to perform operations offline
      await page.click('[data-testid="add-task-button"]');
      await page.fill('input[name="title"]', 'Offline task');
      await page.click('button[type="submit"]');
      
      const offlineTime = performance.now() - startTime;
      
      // Offline operations should be fast (under 500ms)
      expect(offlineTime).toBeLessThan(500);
    });
  });

  test.describe('Bundle Size Performance', () => {
    test('should have acceptable JavaScript bundle size', async ({ page }) => {
      // Navigate to page and measure resources
      await page.goto('/dashboard');
      
      const resourceSizes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        let totalJSSize = 0;
        let totalCSSSize = 0;
        
        resources.forEach((resource: any) => {
          if (resource.name.includes('.js')) {
            totalJSSize += resource.transferSize || 0;
          }
          if (resource.name.includes('.css')) {
            totalCSSSize += resource.transferSize || 0;
          }
        });
        
        return { totalJSSize, totalCSSSize };
      });
      
      // JavaScript bundle should be under 1MB
      expect(resourceSizes.totalJSSize).toBeLessThan(1024 * 1024);
      
      // CSS should be under 100KB
      expect(resourceSizes.totalCSSSize).toBeLessThan(100 * 1024);
    });

    test('should load critical resources first', async ({ page }) => {
      await page.goto('/dashboard');
      
      const resourceTimings = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources
          .filter((resource: any) => resource.name.includes('.js') || resource.name.includes('.css'))
          .map((resource: any) => ({
            name: resource.name,
            startTime: resource.startTime,
            duration: resource.duration,
          }))
          .sort((a, b) => a.startTime - b.startTime);
      });
      
      // Critical resources should load first
      if (resourceTimings.length > 0) {
        const firstResource = resourceTimings[0];
        expect(firstResource.startTime).toBeLessThan(100); // Should start loading quickly
      }
    });
  });

  test.describe('Animation Performance', () => {
    test('should maintain 60fps during animations', async ({ page }) => {
      // Trigger theme transition animation
      await page.click('[data-testid="theme-toggle"]');
      
      // Measure frame rate during animation
      const frameRate = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frames);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      // Should maintain close to 60fps (allow some variance)
      expect(frameRate).toBeGreaterThan(50);
    });

    test('should handle multiple simultaneous animations', async ({ page }) => {
      // Create multiple tasks to animate
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.fill('input[name="title"]', `Animation task ${i}`);
        await page.click('button[type="submit"]');
      }
      
      const startTime = performance.now();
      
      // Trigger multiple animations (bulk complete)
      await page.keyboard.press('Control+a');
      await page.click('[data-testid="bulk-complete-button"]');
      
      // Wait for animations to complete
      await page.waitForTimeout(1000);
      
      const animationTime = performance.now() - startTime;
      
      // Multiple animations should complete within 1.5 seconds
      expect(animationTime).toBeLessThan(1500);
    });
  });
});