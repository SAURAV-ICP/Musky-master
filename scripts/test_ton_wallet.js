#!/usr/bin/env node

/**
 * This script tests the TON wallet integration by:
 * 1. Checking if a user exists
 * 2. Updating the user's TON wallet address
 * 3. Verifying the update
 * 
 * Usage:
 * node scripts/test_ton_wallet.js [user_id]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (can be overridden by command line argument)
const testUserId = process.argv[2] || '7093793454';

// Test TON wallet address
const testTonAddress = 'EQD3dyGQzfA4luZMV0G6gwlqT08XTVVQKKKHPa3DxmQJN9KQ';

async function testTonWalletIntegration() {
  console.log('🧪 Starting TON wallet integration test...');
  console.log(`📋 Using test user ID: ${testUserId}`);
  console.log(`📋 Using test TON address: ${testTonAddress}`);
  
  try {
    // Step 1: Check if the user exists
    console.log('\n📋 Step 1: Checking if user exists...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (userError) {
      console.error(`❌ Error fetching user: ${userError.message}`);
      return;
    }
    
    if (!user) {
      console.error(`❌ User with ID ${testUserId} not found`);
      return;
    }
    
    console.log(`✅ User found: ${user.username || user.user_id}`);
    console.log(`📋 Current TON address: ${user.ton_address || 'Not set'}`);
    
    // Step 2: Update the user's TON wallet address
    console.log('\n📋 Step 2: Updating TON wallet address...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ ton_address: testTonAddress })
      .eq('user_id', testUserId);
    
    if (updateError) {
      console.error(`❌ Error updating TON address: ${updateError.message}`);
      return;
    }
    
    console.log(`✅ TON address updated to: ${testTonAddress}`);
    
    // Step 3: Verify the update
    console.log('\n📋 Step 3: Verifying the update...');
    
    const { data: updatedUser, error: verifyError } = await supabase
      .from('users')
      .select('ton_address, ton_address_updated_at')
      .eq('user_id', testUserId)
      .single();
    
    if (verifyError) {
      console.error(`❌ Error verifying update: ${verifyError.message}`);
      return;
    }
    
    if (updatedUser.ton_address !== testTonAddress) {
      console.error(`❌ Verification failed: TON address was not updated correctly`);
      console.error(`Expected: ${testTonAddress}, Got: ${updatedUser.ton_address}`);
      return;
    }
    
    console.log(`✅ TON address verified: ${updatedUser.ton_address}`);
    console.log(`📋 Last updated: ${updatedUser.ton_address_updated_at || 'Not available'}`);
    
    console.log('\n🎉 TON wallet integration test completed successfully!');
    
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
  }
}

// Run the test
testTonWalletIntegration(); 