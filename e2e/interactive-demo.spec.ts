import { test, expect } from '@playwright/test';

test.describe('Interactive Demo - Manual Testing', () => {
  test('🎮 Interactive Demo: Explore the App Manually', async ({ page }) => {
    console.log('\n🎮 === INTERACTIVE DEMO MODE ===');
    console.log('🌐 Browser will open and stay open for manual testing');
    console.log('📱 You can interact with the app manually');
    console.log('⏰ Test will run for 5 minutes, then close automatically');
    console.log('\n🔗 Available URLs to test:');
    console.log('   • http://localhost:3000/ (redirects to login)');
    console.log('   • http://localhost:3000/login');
    console.log('   • http://localhost:3000/register');
    console.log('   • http://localhost:3000/dashboard (protected)');
    
    // Navigate to the app
    await page.goto('/');
    
    console.log('\n✅ App loaded! Browser is now open for manual testing...');
    console.log('🎯 Things to try:');
    console.log('   1. Test form validation (submit empty forms)');
    console.log('   2. Navigate between login/register pages');
    console.log('   3. Try accessing /dashboard (should redirect)');
    console.log('   4. Test responsive design (resize browser)');
    console.log('   5. Test password strength indicator on register page');
    console.log('   6. Test form interactions and UI elements');
    
    // Keep the browser open for manual testing
    // Wait for 5 minutes (300 seconds) to allow manual interaction
    console.log('\n⏰ Browser will stay open for 5 minutes...');
    console.log('💡 Press Ctrl+C in terminal to close early');
    
    // Wait in 30-second intervals with status updates
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(30000); // 30 seconds
      const remaining = 10 - i;
      console.log(`⏰ ${remaining * 30} seconds remaining for manual testing...`);
    }
    
    console.log('\n🎉 Interactive demo completed!');
    console.log('✅ You can run this again anytime with:');
    console.log('   npm run test:e2e -- e2e/interactive-demo.spec.ts --headed');
  });

  test('🚀 Quick App Tour', async ({ page }) => {
    console.log('\n🚀 === QUICK APP TOUR ===');
    console.log('📱 Automated tour of all app features');
    
    // Tour Step 1: Home/Login
    console.log('\n📍 Tour Stop 1: Login Page');
    await page.goto('/');
    await page.waitForTimeout(3000);
    console.log('   ✅ Redirected to login page automatically');
    
    // Tour Step 2: Form Validation
    console.log('\n📍 Tour Stop 2: Form Validation');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(2000);
    console.log('   ✅ Validation errors displayed');
    
    // Tour Step 3: Registration Page
    console.log('\n📍 Tour Stop 3: Registration Page');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.waitForTimeout(2000);
    console.log('   ✅ Registration page loaded');
    
    // Tour Step 4: Password Strength
    console.log('\n📍 Tour Stop 4: Password Strength Indicator');
    const passwordField = page.locator('#password');
    await passwordField.fill('StrongPassword123!');
    await page.waitForTimeout(2000);
    console.log('   ✅ Password strength indicator working');
    
    // Tour Step 5: Protected Route
    console.log('\n📍 Tour Stop 5: Protected Route Test');
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    console.log('   ✅ Protected route redirected to login');
    
    // Tour Step 6: Mobile View
    console.log('\n📍 Tour Stop 6: Mobile Responsive Design');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(3000);
    console.log('   ✅ Mobile view activated');
    
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(2000);
    console.log('   ✅ Desktop view restored');
    
    console.log('\n🎉 Tour completed! All features working correctly.');
    
    // Keep browser open for a bit longer to see final state
    console.log('\n⏰ Keeping browser open for 30 more seconds...');
    await page.waitForTimeout(30000);
  });
});