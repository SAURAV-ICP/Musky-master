// Test script for TON wallet integration
// Run with: node scripts/test_ton_wallet.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with a real user ID from your database)
const TEST_USER_ID = process.env.NEXT_PUBLIC_ADMIN_ID || '7093793454';

// Test TON wallet address
const TEST_TON_ADDRESS = 'EQD3dyGQzfA4luZMV0G6gwlqT08XTVVQKKKHPa3DxmQJN9KQ';

async function testTonWalletIntegration() {
  console.log('🧪 Testing TON wallet integration...');
  
  try {
    // Step 1: Check if the user exists
    console.log(`📋 Checking if user ${TEST_USER_ID} exists...`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError.message);
      return;
    }
    
    console.log('✅ User found:', {
      user_id: user.user_id,
      username: user.username,
      is_admin: user.is_admin,
      ton_address: user.ton_address || 'Not set'
    });
    
    // Step 2: Update the user's TON address
    console.log(`📝 Updating TON address to ${TEST_TON_ADDRESS}...`);
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ton_address: TEST_TON_ADDRESS
      })
      .eq('user_id', TEST_USER_ID)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating TON address:', updateError.message);
      return;
    }
    
    console.log('✅ TON address updated successfully:', {
      user_id: updatedUser.user_id,
      ton_address: updatedUser.ton_address
    });
    
    // Step 3: Verify that the TON address was updated
    console.log('🔍 Verifying TON address update...');
    const { data: verifiedUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying TON address:', verifyError.message);
      return;
    }
    
    if (verifiedUser.ton_address === TEST_TON_ADDRESS) {
      console.log('✅ TON address verified successfully!');
    } else {
      console.error('❌ TON address verification failed!', {
        expected: TEST_TON_ADDRESS,
        actual: verifiedUser.ton_address
      });
    }
    
    console.log('🎉 TON wallet integration test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testTonWalletIntegration(); 