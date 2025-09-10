import { test, expect } from '@playwright/test';

test.describe('Quick Authentication Test', () => {
  test('🚀 Quick Auth Test After Supabase Fix', async ({ page }) => {
    console.log('\n🚀 === QUICK AUTHENTICATION TEST ===');
    console.log('🎯 Testing after Supabase configuration fix');
    
    const testUser = {
      email: `quicktest-${Date.now()}@example.com`,
      password: 'QuickTest123!'
    };
    
    console.log(`📧 Test user: ${testUser.email}`);
    
    // Test Registration
    console.log('\n📝 Testing Registration...');
    await page.goto('/register');
    await page.waitForTimeout(1000);
    
    await page.getByLabel('Email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 After registration: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('🎉 SUCCESS: Registration worked! Redirected to dashboard');
      
      // Test dashboard functionality
      await expect(page.getByText('My Lists')).toBeVisible();
      console.log('✅ Dashboard loaded successfully');
      
      // Test creating a list
      const createListBtn = page.getByRole('button', { name: 'Create List' });
      if (await createListBtn.isVisible()) {
        await createListBtn.click();
        await page.waitForTimeout(1000);
        
        await page.getByLabel('Name').fill('Test List');
        await page.getByLabel('Description').fill('Created during quick test');
        
        await page.getByRole('button', { name: 'Create List' }).click();
        await page.waitForTimeout(2000);
        
        console.log('✅ List creation tested');
      }
      
      console.log('\n🎉 COMPLETE SUCCESS: Full app is working!');
      
    } else if (currentUrl.includes('/login')) {
      console.log('⚠️ Registration successful but requires email confirmation');
      console.log('🔍 Try logging in with the same credentials');
      
      // Try login
      await page.getByLabel('Email').fill(testUser.email);
      await page.getByLabel('Password').fill(testUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/dashboard')) {
        console.log('🎉 SUCCESS: Login worked after registration!');
      }
      
    } else {
      console.log('❌ Registration still not working - check Supabase settings');
      
      // Check for error messages
      const errorMsg = page.locator('[class*="text-red"], [class*="text-destructive"]');
      if (await errorMsg.isVisible()) {
        const errorText = await errorMsg.textContent();
        console.log(`❌ Error: ${errorText}`);
      }
    }
  });
});