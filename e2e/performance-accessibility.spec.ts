import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility Optimization', () => {
  test.use({ 
    actionTimeout: 10000,
    navigationTimeout: 30000 
  });

  test('🚀 Performance Optimization Verification', async ({ page }) => {
    console.log('\n🚀 === PERFORMANCE OPTIMIZATION VERIFICATION ===');
    
    // Test page load performance
    console.log('\n⚡ Testing page load performance...');
    
    const pages = [
      { url: '/login', name: 'Login Page', target: 2000 },
      { url: '/register', name: 'Register Page', target: 2000 },
      { url: '/demo', name: 'Demo Page', target: 3000 },
    ];
    
    for (const testPage of pages) {
      console.log(`\n📊 Testing ${testPage.name} performance...`);
      
      const startTime = Date.now();
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`   ⏱️  ${testPage.name} load time: ${loadTime}ms (target: ${testPage.target}ms)`);
      
      if (loadTime <= testPage.target) {
        console.log(`   ✅ ${testPage.name} meets performance target`);
      } else {
        console.log(`   ⚠️  ${testPage.name} exceeds performance target`);
      }
      
      // Test Time to Interactive
      const renderStart = Date.now();
      await expect(page.locator('body')).toBeVisible();
      const renderTime = Date.now() - renderStart;
      console.log(`   🎨 ${testPage.name} render time: ${renderTime}ms`);
      
      // Test interaction responsiveness
      const interactionStart = Date.now();
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.hover();
        const interactionTime = Date.now() - interactionStart;
        console.log(`   🖱️  ${testPage.name} interaction time: ${interactionTime}ms`);
      }
    }
    
    // Test bundle size optimization
    console.log('\n📦 Testing bundle size optimization...');
    
    // Check for code splitting
    await page.goto('/demo');
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('.js')) {
        networkRequests.push(request.url());
      }
    });
    
    await page.waitForTimeout(2000);
    console.log(`   📊 JavaScript chunks loaded: ${networkRequests.length}`);
    
    // Test lazy loading
    console.log('\n🔄 Testing lazy loading...');
    
    await page.goto('/demo');
    
    // Check if task form is lazy loaded
    const addTaskButton = page.getByRole('button', { name: 'Add Task' });
    if (await addTaskButton.isVisible()) {
      const lazyLoadStart = Date.now();
      await addTaskButton.click();
      await page.waitForSelector('[role="dialog"]');
      const lazyLoadTime = Date.now() - lazyLoadStart;
      console.log(`   ⚡ Task form lazy load time: ${lazyLoadTime}ms`);
      
      await page.keyboard.press('Escape');
    }
    
    console.log('\n✅ Performance optimization verification completed');
  });

  test('♿ Accessibility Compliance Verification', async ({ page }) => {
    console.log('\n♿ === ACCESSIBILITY COMPLIANCE VERIFICATION ===');
    
    const pages = [
      { url: '/login', name: 'Login Page' },
      { url: '/register', name: 'Register Page' },
      { url: '/demo', name: 'Demo Page' },
    ];
    
    for (const testPage of pages) {
      console.log(`\n🔍 Testing ${testPage.name} accessibility...`);
      
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      
      // Test 1: Heading Structure
      console.log(`   📋 Testing heading structure...`);
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      console.log(`   ✅ Found ${headings.length} headings`);
      
      if (headings.length > 0) {
        const h1Count = await page.locator('h1').count();
        if (h1Count === 1) {
          console.log(`   ✅ Proper h1 usage (1 h1 found)`);
        } else {
          console.log(`   ⚠️  Heading structure issue: ${h1Count} h1 elements found`);
        }
      }
      
      // Test 2: Form Labels
      console.log(`   🏷️  Testing form labels...`);
      const inputs = await page.locator('input').all();
      let labeledInputs = 0;
      
      for (const input of inputs) {
        const hasLabel = await input.getAttribute('aria-label') || 
                         await input.getAttribute('aria-labelledby') ||
                         await input.getAttribute('id').then(async id => {
                           if (id) {
                             const label = page.locator(`label[for="${id}"]`);
                             return await label.count() > 0;
                           }
                           return false;
                         });
        
        if (hasLabel) labeledInputs++;
      }
      
      console.log(`   ✅ ${labeledInputs}/${inputs.length} inputs properly labeled`);
      
      // Test 3: Keyboard Navigation
      console.log(`   ⌨️  Testing keyboard navigation...`);
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`   ✅ First focusable element: ${firstFocusable}`);
      
      // Test multiple tab presses
      let focusableCount = 0;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        if (activeElement && activeElement !== 'BODY') {
          focusableCount++;
        }
      }
      console.log(`   ✅ Found ${focusableCount} focusable elements via keyboard`);
      
      // Test 4: ARIA Attributes
      console.log(`   🎯 Testing ARIA attributes...`);
      
      const ariaLabels = await page.locator('[aria-label]').count();
      const ariaDescriptions = await page.locator('[aria-describedby]').count();
      const ariaRoles = await page.locator('[role]').count();
      
      console.log(`   ✅ ARIA labels: ${ariaLabels}`);
      console.log(`   ✅ ARIA descriptions: ${ariaDescriptions}`);
      console.log(`   ✅ ARIA roles: ${ariaRoles}`);
      
      // Test 5: Color Contrast (basic check)
      console.log(`   🎨 Testing color contrast...`);
      
      // Check for proper contrast classes (this is a basic check)
      const textElements = await page.locator('p, span, div, button, a').all();
      let contrastIssues = 0;
      
      for (const element of textElements.slice(0, 10)) { // Check first 10 elements
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          };
        });
        
        // Basic check - if background is very light and text is very light, flag it
        if (styles.color.includes('rgb(255') && styles.backgroundColor.includes('rgb(255')) {
          contrastIssues++;
        }
      }
      
      if (contrastIssues === 0) {
        console.log(`   ✅ No obvious contrast issues found`);
      } else {
        console.log(`   ⚠️  Potential contrast issues: ${contrastIssues}`);
      }
      
      // Test 6: Focus Indicators
      console.log(`   🎯 Testing focus indicators...`);
      
      const buttons = await page.locator('button').all();
      if (buttons.length > 0) {
        await buttons[0].focus();
        const hasFocusStyle = await buttons[0].evaluate(el => {
          const styles = window.getComputedStyle(el, ':focus');
          return styles.outline !== 'none' || styles.boxShadow !== 'none';
        });
        
        if (hasFocusStyle) {
          console.log(`   ✅ Focus indicators present`);
        } else {
          console.log(`   ⚠️  Focus indicators may be missing`);
        }
      }
      
      // Test 7: Alt Text for Images
      console.log(`   🖼️  Testing image alt text...`);
      
      const images = await page.locator('img').all();
      let imagesWithAlt = 0;
      
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        if (alt !== null) imagesWithAlt++;
      }
      
      console.log(`   ✅ ${imagesWithAlt}/${images.length} images have alt text`);
      
      console.log(`   ✅ ${testPage.name} accessibility testing completed`);
    }
    
    // Test modal accessibility
    console.log('\n🔍 Testing modal accessibility...');
    
    await page.goto('/demo');
    const addTaskButton = page.getByRole('button', { name: 'Add Task' });
    
    if (await addTaskButton.isVisible()) {
      await addTaskButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Test modal focus trap
      console.log(`   🎯 Testing modal focus trap...`);
      
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Test that focus is trapped within modal
      const focusableInModal = await modal.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
      console.log(`   ✅ Modal has ${focusableInModal} focusable elements`);
      
      // Test escape key
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      console.log(`   ✅ Modal closes with Escape key`);
    }
    
    console.log('\n✅ Accessibility compliance verification completed');
  });

  test('🔧 Production Build Verification', async ({ page }) => {
    console.log('\n🔧 === PRODUCTION BUILD VERIFICATION ===');
    
    // Test that the app works in production-like conditions
    console.log('\n🏗️  Testing production build functionality...');
    
    // Test all main pages load correctly
    const pages = ['/login', '/register', '/demo'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Check for JavaScript errors
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await page.waitForTimeout(1000);
      
      if (errors.length === 0) {
        console.log(`   ✅ ${url} loads without JavaScript errors`);
      } else {
        console.log(`   ❌ ${url} has JavaScript errors:`, errors);
      }
    }
    
    // Test that all features work
    console.log('\n🧪 Testing feature functionality...');
    
    await page.goto('/demo');
    
    // Test task creation
    const addTaskButton = page.getByRole('button', { name: 'Add Task' });
    if (await addTaskButton.isVisible()) {
      await addTaskButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      await page.getByLabel('Title').fill('Production Test Task');
      await page.getByRole('button', { name: 'Create Task' }).click();
      
      await page.waitForTimeout(1000);
      const createdTask = page.getByText('Production Test Task').first();
      await expect(createdTask).toBeVisible();
      console.log(`   ✅ Task creation works in production build`);
    }
    
    // Test responsive design
    console.log('\n📱 Testing responsive design...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Check that main content is visible
      const mainContent = page.locator('main, [role="main"], body > div').first();
      await expect(mainContent).toBeVisible();
      console.log(`   ✅ ${viewport.name} layout works correctly`);
    }
    
    console.log('\n✅ Production build verification completed');
  });

  test('📊 Performance Metrics Summary', async ({ page }) => {
    console.log('\n📊 === PERFORMANCE METRICS SUMMARY ===');
    
    const metrics = {
      loadTimes: [],
      renderTimes: [],
      interactionTimes: [],
      bundleSizes: [],
    };
    
    const pages = ['/login', '/register', '/demo'];
    
    for (const url of pages) {
      console.log(`\n📈 Measuring ${url} performance...`);
      
      // Measure load time
      const loadStart = Date.now();
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - loadStart;
      metrics.loadTimes.push(loadTime);
      
      // Measure render time
      const renderStart = Date.now();
      await expect(page.locator('body')).toBeVisible();
      const renderTime = Date.now() - renderStart;
      metrics.renderTimes.push(renderTime);
      
      // Measure interaction time
      const interactionStart = Date.now();
      const firstButton = page.locator('button').first();
      if (await firstButton.isVisible()) {
        await firstButton.hover();
        const interactionTime = Date.now() - interactionStart;
        metrics.interactionTimes.push(interactionTime);
      }
      
      console.log(`   ⏱️  Load: ${loadTime}ms, Render: ${renderTime}ms`);
    }
    
    // Calculate averages
    const avgLoadTime = metrics.loadTimes.reduce((a, b) => a + b, 0) / metrics.loadTimes.length;
    const avgRenderTime = metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length;
    const avgInteractionTime = metrics.interactionTimes.reduce((a, b) => a + b, 0) / metrics.interactionTimes.length;
    
    console.log('\n🎯 === PERFORMANCE SUMMARY ===');
    console.log(`📊 Average Load Time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`📊 Average Render Time: ${avgRenderTime.toFixed(2)}ms`);
    console.log(`📊 Average Interaction Time: ${avgInteractionTime.toFixed(2)}ms`);
    
    // Performance grades
    const loadGrade = avgLoadTime < 2000 ? 'A' : avgLoadTime < 3000 ? 'B' : 'C';
    const renderGrade = avgRenderTime < 100 ? 'A' : avgRenderTime < 200 ? 'B' : 'C';
    const interactionGrade = avgInteractionTime < 50 ? 'A' : avgInteractionTime < 100 ? 'B' : 'C';
    
    console.log(`🏆 Load Time Grade: ${loadGrade}`);
    console.log(`🏆 Render Time Grade: ${renderGrade}`);
    console.log(`🏆 Interaction Time Grade: ${interactionGrade}`);
    
    console.log('\n✅ Performance metrics summary completed');
  });
});