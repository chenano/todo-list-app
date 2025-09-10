const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://shzueztrnmdkaifpxixj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoenVlenRybm1ka2FpZnB4aXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzI4NzcsImV4cCI6MjA1MjU0ODg3N30.sbp_cc1ebcef63bafab3ff9c94d0d0cfc73e42f4391d';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('lists').select('count').limit(1);
    console.log('✅ Supabase connection successful');
    console.log('📊 Database accessible:', !error);
    
    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      if (authError.message.includes('Email not confirmed')) {
        console.log('📧 Email confirmation is required');
      }
    } else {
      console.log('✅ Authentication working');
      console.log('👤 User created:', authData.user ? 'Yes' : 'No');
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testSupabase();