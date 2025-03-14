#!/usr/bin/env node

/**
 * This script updates TON balances for all users with connected wallets.
 * It fetches the balance from the TON Center API and updates the database.
 * 
 * Usage:
 * node scripts/update_ton_balances.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

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

// TON API endpoint (using TON Center API)
const TON_API_URL = 'https://toncenter.com/api/v2/getAddressBalance';
const TON_API_KEY = process.env.TON_API_KEY || ''; // Optional API key for higher rate limits

/**
 * Fetches the TON balance for a given address
 * @param {string} address - The TON wallet address
 * @returns {Promise<number>} - The balance in TON
 */
async function getTonBalance(address) {
  try {
    const url = `${TON_API_URL}?api_key=${TON_API_KEY}&address=${address}`;
    const response = await axios.get(url);
    
    if (response.data && response.data.result) {
      // Convert from nanoTON to TON (1 TON = 10^9 nanoTON)
      return parseFloat(response.data.result) / 1000000000;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error.message);
    return 0;
  }
}

/**
 * Updates TON balances for all users with connected wallets
 */
async function updateTonBalances() {
  console.log('🔄 Starting TON balance update process...');
  
  try {
    // Get all users with TON addresses
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('user_id, ton_address')
      .not('ton_address', 'is', null)
      .not('ton_address', 'eq', '');
    
    if (userError) {
      console.error('❌ Error fetching users:', userError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️ No users with TON addresses found');
      return;
    }
    
    console.log(`📊 Found ${users.length} users with TON addresses`);
    
    // Process users in batches to avoid rate limits
    const BATCH_SIZE = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`⏳ Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(users.length/BATCH_SIZE)}...`);
      
      // Process each user in the batch
      const batchPromises = batch.map(async (user) => {
        try {
          // Get TON balance from API
          const balance = await getTonBalance(user.ton_address);
          
          // Update user's TON balance in database
          const { error: updateError } = await supabase
            .from('users')
            .update({ ton_balance: balance })
            .eq('user_id', user.user_id);
          
          if (updateError) {
            console.error(`❌ Error updating balance for user ${user.user_id}:`, updateError.message);
            errorCount++;
            return;
          }
          
          console.log(`✅ Updated balance for user ${user.user_id}: ${balance} TON`);
          successCount++;
        } catch (error) {
          console.error(`❌ Error processing user ${user.user_id}:`, error.message);
          errorCount++;
        }
      });
      
      // Wait for all users in the batch to be processed
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < users.length) {
        console.log('⏱️ Waiting 2 seconds before processing next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Log the update to the database for tracking
    try {
      await supabase
        .from('cron_logs')
        .insert({
          job_name: 'update_ton_balances',
          success_count: successCount,
          error_count: errorCount,
          details: `Updated TON balances for ${successCount} users with ${errorCount} errors`
        });
      
      console.log('📝 Logged update to cron_logs table');
    } catch (logError) {
      console.error('❌ Error logging to cron_logs:', logError.message);
    }
    
    console.log('🎉 TON balance update completed!');
    console.log(`📊 Summary: ${successCount} successful updates, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the update
updateTonBalances(); 