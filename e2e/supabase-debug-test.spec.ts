import { test, expect } from '@playwright/test';

test.describe('Supabase Configuration Debug', () => {
  test.use({ 
    actionTimeout: 15000,
    navigationTimeout: 30000 
  });

  test('🔍 Debug Supabase Authentication Issues', async ({ page }) => {
    console.log('\n🔍 === SUPABASE AUTHENTICATION DEBUG ===');
    console.log('🎯 Diagnosing authentication issues');
    
    // Step 1: Check environment variables
    console.log('\n📋 STEP 1: CHECKING CONFIGURATION');
    
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Check if page loads (indicates env vars are working)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    console.log('✅ App loads correctly - environment variables are set');
    
    // Step 2: Test registration with network monitoring
    console.log('\n📝 STEP 2: TESTING REGISTRATION WITH NETWORK MONITORING');
    
    // Listen for network requests
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('supabase.co')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase.co')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`📥 Response: ${response.status()} ${response.statusText()} - ${response.url()}`);
      }
    });
    
    await page.goto('/register');
    await page.waitForTimeout(1000);
    
    // Fill registration form
    const testEmail = `debug-test-${Date.now()}@example.com`;
    await page.getByLabel('Email').fill(testEmail);
    await page.locator('#password').fill('DebugTest123!');
    await page.getByLabel('Confirm Password').fill('DebugTest123!');
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Submit registration and capture response
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Analyze responses
    console.log('\n📊 NETWORK ANALYSIS:');
    responses.forEach(response => {
      console.log(`   ${response.status} - ${response.url}`);
      if (response.status === 401) {
        console.log('   ❌ 401 Unauthorized - This indicates:');
        console.log('      • Sign-up might be disabled in Supabase');
        console.log('      • Email confirmation is required');
        console.log('      • API key permissions issue');
        console.log('      • Rate limiting');
      } else if (response.status === 200) {
        console.log('   ✅ 200 OK - Registration request successful');
      } else if (response.status === 422) {
        console.log('   ⚠️ 422 Unprocessable Entity - Validation error');
      }
    });
    
    // Step 3: Check for error messages in UI
    console.log('\n🔍 STEP 3: CHECKING UI ERROR MESSAGES');
    
    const errorSelectors = [
      '[class*="text-red"]',
      '[class*="text-destructive"]',
      '[role="alert"]',
      '.error',
      '[data-testid="error"]'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Error found: ${errorText}`);
      }
    }
    
    // Step 4: Test with existing user (if any)
    console.log('\n🔐 STEP 4: TESTING LOGIN WITH KNOWN CREDENTIALS');
    
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Try login with a test account (this will fail but we can see the response)
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('testpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.waitForTimeout(3000);
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('🔍 Based on the 401 error, here are the most likely causes:');
    console.log('');
    console.log('1. 📧 EMAIL CONFIRMATION REQUIRED:');
    console.log('   • Supabase requires email confirmation before login');
    console.log('   • Check your Supabase Auth settings');
    console.log('   • Disable email confirmation for testing');
    console.log('');
    console.log('2. 🚫 SIGN-UP DISABLED:');
    console.log('   • Public sign-up might be disabled in Supabase');
    console.log('   • Enable public sign-up in Auth settings');
    console.log('');
    console.log('3. 🔑 API KEY ISSUES:');
    console.log('   • Check if your anon key has correct permissions');
    console.log('   • Verify the key is not expired');
    console.log('');
    console.log('4. 🌐 CORS/DOMAIN ISSUES:');
    console.log('   • Add localhost:3000 to allowed origins');
    console.log('   • Check site URL configuration');
    
    console.log('\n🛠️ RECOMMENDED FIXES:');
    console.log('1. Go to Supabase Dashboard → Authentication → Settings');
    console.log('2. Disable "Enable email confirmations" for testing');
    console.log('3. Enable "Enable sign ups" if disabled');
    console.log('4. Add "http://localhost:3000" to Site URL');
    console.log('5. Check that RLS policies allow user registration');
  });

  test('🧪 Test Manual Authentication Flow', async ({ page }) => {
    console.log('\n🧪 === MANUAL AUTHENTICATION FLOW TEST ===');
    console.log('🎯 Testing authentication with manual intervention');
    
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    console.log('📋 INSTRUCTIONS FOR MANUAL TESTING:');
    console.log('1. The browser will stay open for 2 minutes');
    console.log('2. Try to register/login manually');
    console.log('3. Check if you can access the dashboard');
    console.log('4. Test creating lists and tasks');
    console.log('');
    console.log('🔗 URLs to test:');
    console.log('   • /register - Registration page');
    console.log('   • /login - Login page');
    console.log('   • /dashboard - Dashboard (after auth)');
    console.log('   • /demo - Demo page (no auth required)');
    
    // Keep browser open for manual testing
    console.log('\n⏰ Browser will stay open for 2 minutes for manual testing...');
    
    for (let i = 1; i <= 12; i++) {
      await page.waitForTimeout(10000); // 10 seconds
      const remaining = 12 - i;
      console.log(`⏰ ${remaining * 10} seconds remaining...`);
    }
    
    console.log('\n✅ Manual testing time completed');
    
    // Check final state
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 SUCCESS: You successfully authenticated and reached the dashboard!');
    } else if (finalUrl.includes('/login') || finalUrl.includes('/register')) {
      console.log('⚠️ Still on auth pages - authentication may need configuration');
    } else {
      console.log(`ℹ️ On page: ${finalUrl}`);
    }
  });
});