import { test, expect } from '@playwright/test';

test.describe('Task Filter Functionality', () => {
  test('should filter tasks correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Register a test user
    const testEmail = `filtertest-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.goto('/register');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Create a test list
    await page.click('button:has-text("Create List")');
    await page.fill('input[name="name"]', 'Test List for Filters');
    await page.fill('textarea[name="description"]', 'Testing filter functionality');
    await page.click('button:has-text("Create List")');
    
    // Wait for list to be created and click on it
    await page.waitForTimeout(2000);
    await page.click('text=Test List for Filters');
    
    // Wait for list page to load
    await page.waitForURL(/\/dashboard\/lists\/.+/);
    
    // Create test tasks with different properties
    const tasks = [
      { title: 'High Priority Task', priority: 'high', completed: false },
      { title: 'Medium Priority Task', priority: 'medium', completed: false },
      { title: 'Low Priority Task', priority: 'low', completed: false },
      { title: 'Completed High Priority', priority: 'high', completed: true },
      { title: 'Completed Medium Priority', priority: 'medium', completed: true },
    ];
    
    for (const task of tasks) {
      // Click Add Task button
      await page.click('button:has-text("Add Task")');
      
      // Fill task form
      await page.fill('input[name="title"]', task.title);
      await page.selectOption('select[name="priority"]', task.priority);
      
      // Submit task
      await page.click('button:has-text("Create Task")');
      await page.waitForTimeout(1000);
      
      // Mark as completed if needed
      if (task.completed) {
        await page.click(`text=${task.title}`).locator('..').locator('input[type="checkbox"]');
        await page.waitForTimeout(500);
      }
    }
    
    // Test filtering by status
    console.log('Testing status filters...');
    
    // Filter by incomplete tasks
    await page.selectOption('select:near(text="Status")', 'incomplete');
    await page.waitForTimeout(1000);
    
    // Should show 3 incomplete tasks
    const incompleteTasks = await page.locator('[data-testid="task-item"]').count();
    expect(incompleteTasks).toBe(3);
    
    // Filter by completed tasks
    await page.selectOption('select:near(text="Status")', 'completed');
    await page.waitForTimeout(1000);
    
    // Should show 2 completed tasks
    const completedTasks = await page.locator('[data-testid="task-item"]').count();
    expect(completedTasks).toBe(2);
    
    // Test filtering by priority
    console.log('Testing priority filters...');
    
    // Reset status filter and filter by high priority
    await page.selectOption('select:near(text="Status")', 'all');
    await page.selectOption('select:near(text="Priority")', 'high');
    await page.waitForTimeout(1000);
    
    // Should show 2 high priority tasks
    const highPriorityTasks = await page.locator('[data-testid="task-item"]').count();
    expect(highPriorityTasks).toBe(2);
    
    // Test combined filters
    console.log('Testing combined filters...');
    
    // Filter by incomplete + high priority
    await page.selectOption('select:near(text="Status")', 'incomplete');
    await page.waitForTimeout(1000);
    
    // Should show 1 task (incomplete high priority)
    const combinedFilterTasks = await page.locator('[data-testid="task-item"]').count();
    expect(combinedFilterTasks).toBe(1);
    
    // Clear filters
    await page.click('button:has-text("Clear")');
    await page.waitForTimeout(1000);
    
    // Should show all 5 tasks
    const allTasks = await page.locator('[data-testid="task-item"]').count();
    expect(allTasks).toBe(5);
    
    console.log('✅ All filter tests passed!');
  });
});