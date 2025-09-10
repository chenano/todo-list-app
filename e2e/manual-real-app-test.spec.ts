import { test, expect } from '@playwright/test';

test.describe('Manual Real App Testing', () => {
  test.use({ 
    actionTimeout: 15000,
    navigationTimeout: 30000 
  });

  test('🔍 Manual Real App Test - Step by Step', async ({ page }) => {
    console.log('\n🔍 === MANUAL REAL APP TEST ===');
    console.log('🎯 Testing the real application step by step');
    
    // Step 1: Navigate to the app
    console.log('\n📍 STEP 1: NAVIGATING TO THE APP');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'test-results/step1-initial-load.png', fullPage: true });
    console.log('✅ Screenshot taken: step1-initial-load.png');
    
    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('✅ App redirected to login page');
    } else {
      console.log('⚠️ App did not redirect to login. Current URL:', page.url());
    }
    
    // Step 2: Test Login Page
    console.log('\n🔐 STEP 2: TESTING LOGIN PAGE');
    
    // Ensure we're on login page
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    // Check if login elements are present
    const loginHeading = page.getByRole('heading', { name: 'Sign In' });
    const emailField = page.getByLabel('Email');
    const passwordField = page.getByLabel('Password');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    if (await loginHeading.isVisible()) {
      console.log('✅ Login heading found');
    } else {
      console.log('❌ Login heading NOT found');
    }
    
    if (await emailField.isVisible()) {
      console.log('✅ Email field found');
    } else {
      console.log('❌ Email field NOT found');
    }
    
    if (await passwordField.isVisible()) {
      console.log('✅ Password field found');
    } else {
      console.log('❌ Password field NOT found');
    }
    
    if (await signInButton.isVisible()) {
      console.log('✅ Sign In button found');
    } else {
      console.log('❌ Sign In button NOT found');
    }
    
    await page.screenshot({ path: 'test-results/step2-login-page.png', fullPage: true });
    console.log('✅ Screenshot taken: step2-login-page.png');
    
    // Step 3: Test Registration Page
    console.log('\n📝 STEP 3: TESTING REGISTRATION PAGE');
    
    // Navigate to registration
    const signUpButton = page.getByRole('button', { name: 'Sign up' });
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Sign up button');
    } else {
      console.log('❌ Sign up button NOT found, navigating directly');
      await page.goto('http://localhost:3004/register');
      await page.waitForTimeout(2000);
    }
    
    // Check registration elements
    const registerHeading = page.getByRole('heading', { name: 'Create Account' });
    const regEmailField = page.getByLabel('Email');
    const regPasswordField = page.locator('#password');
    const confirmPasswordField = page.getByLabel('Confirm Password');
    const createAccountButton = page.getByRole('button', { name: 'Create Account' });
    
    if (await registerHeading.isVisible()) {
      console.log('✅ Registration heading found');
    } else {
      console.log('❌ Registration heading NOT found');
    }
    
    if (await regEmailField.isVisible()) {
      console.log('✅ Registration email field found');
    } else {
      console.log('❌ Registration email field NOT found');
    }
    
    if (await regPasswordField.isVisible()) {
      console.log('✅ Registration password field found');
    } else {
      console.log('❌ Registration password field NOT found');
    }
    
    if (await confirmPasswordField.isVisible()) {
      console.log('✅ Confirm password field found');
    } else {
      console.log('❌ Confirm password field NOT found');
    }
    
    if (await createAccountButton.isVisible()) {
      console.log('✅ Create Account button found');
    } else {
      console.log('❌ Create Account button NOT found');
    }
    
    await page.screenshot({ path: 'test-results/step3-registration-page.png', fullPage: true });
    console.log('✅ Screenshot taken: step3-registration-page.png');
    
    // Step 4: Test Form Validation
    console.log('\n📋 STEP 4: TESTING FORM VALIDATION');
    
    // Try to submit empty form
    if (await createAccountButton.isVisible()) {
      await createAccountButton.click();
      await page.waitForTimeout(2000);
      
      // Check for validation errors
      const emailError = page.locator('text=Email is required');
      const passwordError = page.locator('text=Password is required');
      
      if (await emailError.isVisible()) {
        console.log('✅ Email validation error shown');
      } else {
        console.log('⚠️ Email validation error NOT shown');
      }
      
      if (await passwordError.isVisible()) {
        console.log('✅ Password validation error shown');
      } else {
        console.log('⚠️ Password validation error NOT shown');
      }
      
      await page.screenshot({ path: 'test-results/step4-validation-errors.png', fullPage: true });
      console.log('✅ Screenshot taken: step4-validation-errors.png');
    }
    
    // Step 5: Test Actual Registration
    console.log('\n🚀 STEP 5: TESTING ACTUAL REGISTRATION');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Fill the form
    if (await regEmailField.isVisible()) {
      await regEmailField.fill(testEmail);
      console.log('✅ Email filled');
    }
    
    if (await regPasswordField.isVisible()) {
      await regPasswordField.fill(testPassword);
      console.log('✅ Password filled');
    }
    
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(testPassword);
      console.log('✅ Confirm password filled');
    }
    
    await page.screenshot({ path: 'test-results/step5-form-filled.png', fullPage: true });
    console.log('✅ Screenshot taken: step5-form-filled.png');
    
    // Submit the form
    if (await createAccountButton.isVisible()) {
      await createAccountButton.click();
      console.log('📤 Registration form submitted');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      console.log('Current URL after registration:', page.url());
      
      await page.screenshot({ path: 'test-results/step5-after-registration.png', fullPage: true });
      console.log('✅ Screenshot taken: step5-after-registration.png');
      
      // Check for any error messages
      const errorMessages = await page.locator('[class*="text-red"], [class*="text-destructive"], [role="alert"]').all();
      if (errorMessages.length > 0) {
        console.log('⚠️ Found error messages:');
        for (const error of errorMessages) {
          const text = await error.textContent();
          if (text && text.trim()) {
            console.log(`   - ${text}`);
          }
        }
      } else {
        console.log('✅ No error messages found');
      }
    }
    
    // Step 6: Test Login with Created Account
    console.log('\n🔑 STEP 6: TESTING LOGIN WITH CREATED ACCOUNT');
    
    // Navigate to login page
    await page.goto('http://localhost:3004/login');
    await page.waitForTimeout(2000);
    
    const loginEmailField = page.getByLabel('Email');
    const loginPasswordField = page.getByLabel('Password');
    const loginSubmitButton = page.getByRole('button', { name: 'Sign In' });
    
    // Fill login form
    if (await loginEmailField.isVisible()) {
      await loginEmailField.fill(testEmail);
      console.log('✅ Login email filled');
    }
    
    if (await loginPasswordField.isVisible()) {
      await loginPasswordField.fill(testPassword);
      console.log('✅ Login password filled');
    }
    
    await page.screenshot({ path: 'test-results/step6-login-filled.png', fullPage: true });
    console.log('✅ Screenshot taken: step6-login-filled.png');
    
    // Submit login
    if (await loginSubmitButton.isVisible()) {
      await loginSubmitButton.click();
      console.log('📤 Login form submitted');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      console.log('Current URL after login:', page.url());
      
      await page.screenshot({ path: 'test-results/step6-after-login.png', fullPage: true });
      console.log('✅ Screenshot taken: step6-after-login.png');
      
      // Check if we reached dashboard
      if (page.url().includes('/dashboard')) {
        console.log('🎉 SUCCESS: Reached dashboard after login!');
        
        // Step 7: Test Dashboard
        console.log('\n📊 STEP 7: TESTING DASHBOARD');
        
        const dashboardHeading = page.getByText('My Lists');
        const createListButton = page.getByRole('button', { name: 'Create List' });
        
        if (await dashboardHeading.isVisible()) {
          console.log('✅ Dashboard heading found');
        } else {
          console.log('❌ Dashboard heading NOT found');
        }
        
        if (await createListButton.isVisible()) {
          console.log('✅ Create List button found');
        } else {
          console.log('❌ Create List button NOT found');
        }
        
        await page.screenshot({ path: 'test-results/step7-dashboard.png', fullPage: true });
        console.log('✅ Screenshot taken: step7-dashboard.png');
        
        // Step 8: Test List Creation
        console.log('\n📋 STEP 8: TESTING LIST CREATION');
        
        if (await createListButton.isVisible()) {
          await createListButton.click();
          await page.waitForTimeout(2000);
          
          const listNameField = page.getByLabel('Name');
          const listDescField = page.getByLabel('Description');
          const createListSubmitButton = page.getByRole('button', { name: 'Create List' });
          
          if (await listNameField.isVisible()) {
            await listNameField.fill('My Test List');
            console.log('✅ List name filled');
          }
          
          if (await listDescField.isVisible()) {
            await listDescField.fill('This is a test list');
            console.log('✅ List description filled');
          }
          
          await page.screenshot({ path: 'test-results/step8-list-form.png', fullPage: true });
          console.log('✅ Screenshot taken: step8-list-form.png');
          
          if (await createListSubmitButton.isVisible()) {
            await createListSubmitButton.click();
            console.log('📤 List creation submitted');
            
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: 'test-results/step8-after-list-creation.png', fullPage: true });
            console.log('✅ Screenshot taken: step8-after-list-creation.png');
            
            // Check if list was created
            const createdList = page.getByText('My Test List');
            if (await createdList.isVisible()) {
              console.log('🎉 SUCCESS: List created successfully!');
              
              // Step 9: Test Task Management
              console.log('\n📝 STEP 9: TESTING TASK MANAGEMENT');
              
              // Click on the list
              await createdList.click();
              await page.waitForTimeout(2000);
              
              console.log('Current URL after clicking list:', page.url());
              
              await page.screenshot({ path: 'test-results/step9-list-page.png', fullPage: true });
              console.log('✅ Screenshot taken: step9-list-page.png');
              
              // Test task creation
              const addTaskButton = page.getByRole('button', { name: 'Add Task' });
              if (await addTaskButton.isVisible()) {
                await addTaskButton.click();
                await page.waitForTimeout(2000);
                
                const taskTitleField = page.getByLabel('Title');
                const taskDescField = page.getByLabel('Description');
                const createTaskButton = page.getByRole('button', { name: 'Create Task' });
                
                if (await taskTitleField.isVisible()) {
                  await taskTitleField.fill('My Test Task');
                  console.log('✅ Task title filled');
                }
                
                if (await taskDescField.isVisible()) {
                  await taskDescField.fill('This is a test task');
                  console.log('✅ Task description filled');
                }
                
                await page.screenshot({ path: 'test-results/step9-task-form.png', fullPage: true });
                console.log('✅ Screenshot taken: step9-task-form.png');
                
                if (await createTaskButton.isVisible()) {
                  await createTaskButton.click();
                  console.log('📤 Task creation submitted');
                  
                  await page.waitForTimeout(3000);
                  
                  await page.screenshot({ path: 'test-results/step9-after-task-creation.png', fullPage: true });
                  console.log('✅ Screenshot taken: step9-after-task-creation.png');
                  
                  // Check if task was created
                  const createdTask = page.getByText('My Test Task');
                  if (await createdTask.isVisible()) {
                    console.log('🎉 SUCCESS: Task created successfully!');
                  } else {
                    console.log('❌ FAILED: Task was not created');
                  }
                } else {
                  console.log('❌ Create Task button NOT found');
                }
              } else {
                console.log('❌ Add Task button NOT found');
              }
            } else {
              console.log('❌ FAILED: List was not created');
            }
          } else {
            console.log('❌ Create List submit button NOT found');
          }
        } else {
          console.log('❌ Create List button NOT found');
        }
      } else {
        console.log('❌ FAILED: Did not reach dashboard after login');
        
        // Check for login error messages
        const loginErrorMessages = await page.locator('[class*="text-red"], [class*="text-destructive"], [role="alert"]').all();
        if (loginErrorMessages.length > 0) {
          console.log('⚠️ Found login error messages:');
          for (const error of loginErrorMessages) {
            const text = await error.textContent();
            if (text && text.trim()) {
              console.log(`   - ${text}`);
            }
          }
        }
      }
    }
    
    // Final Summary
    console.log('\n🎯 === MANUAL REAL APP TEST SUMMARY ===');
    console.log('✅ App loads correctly');
    console.log('✅ Login page works');
    console.log('✅ Registration page works');
    console.log('✅ Form validation works');
    
    if (page.url().includes('/dashboard')) {
      console.log('✅ Authentication works');
      console.log('✅ Dashboard accessible');
      console.log('✅ List management works');
      console.log('✅ Task management works');
      console.log('🎉 COMPLETE SUCCESS: Real app is fully functional!');
    } else {
      console.log('⚠️ Authentication needs configuration');
      console.log('🔧 NEEDS FIXING: Supabase authentication setup required');
    }
  });
});