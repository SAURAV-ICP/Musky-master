import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use the service role key if available, otherwise fall back to the anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.');
}

if (!supabaseKey) {
  throw new Error('Supabase key is required. Please set either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// TON API endpoint (using TON Center API)
const TON_API_URL = 'https://toncenter.com/api/v2/getAddressBalance';
const TON_API_KEY = process.env.TON_API_KEY || ''; // Optional API key for higher rate limits

// Secret key for securing the cron job
const CRON_SECRET_KEY = process.env.CRON_SECRET_KEY;

/**
 * Fetches the TON balance for a given address
 * @param {string} address - The TON wallet address
 * @returns {Promise<number>} - The balance in TON
 */
async function getTonBalance(address: string): Promise<number> {
  try {
    const url = `${TON_API_URL}?api_key=${TON_API_KEY}&address=${address}`;
    const response = await axios.get(url);
    
    if (response.data && response.data.result) {
      // Convert from nanoTON to TON (1 TON = 10^9 nanoTON)
      return parseFloat(response.data.result) / 1000000000;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return 0;
  }
}

/**
 * Logs the cron job execution to the database
 */
async function logCronExecution(jobName: string, successCount: number, errorCount: number, details: string) {
  try {
    await supabase
      .from('cron_logs')
      .insert({
        job_name: jobName,
        success_count: successCount,
        error_count: errorCount,
        details: details
      });
    
    return true;
  } catch (error) {
    console.error('Error logging cron execution:', error);
    return false;
  }
}

export async function GET(request: Request) {
  // Verify the secret key to secure the cron job
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get('key');
  
  if (!CRON_SECRET_KEY) {
    console.error('CRON_SECRET_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'Server configuration error: CRON_SECRET_KEY is not set' },
      { status: 500 }
    );
  }
  
  if (secretKey !== CRON_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Get all users with TON addresses
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('user_id, ton_address')
      .not('ton_address', 'is', null)
      .not('ton_address', 'eq', '');
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: userError },
        { status: 500 }
      );
    }
    
    if (!users || users.length === 0) {
      await logCronExecution('update_ton_balances', 0, 0, 'No users with TON addresses found');
      return NextResponse.json(
        { message: 'No users with TON addresses found' },
        { status: 200 }
      );
    }
    
    console.log(`Found ${users.length} users with TON addresses`);
    
    // Process users in batches to avoid rate limits
    const BATCH_SIZE = 10;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(users.length/BATCH_SIZE)}...`);
      
      // Process each user in the batch
      const batchPromises = batch.map(async (user) => {
        try {
          if (!user.ton_address) {
            console.log(`Skipping user ${user.user_id}: No TON address`);
            return;
          }
          
          // Get TON balance from API
          const balance = await getTonBalance(user.ton_address);
          
          // Update user's TON balance in database
          const { error: updateError } = await supabase
            .from('users')
            .update({ ton_balance: balance })
            .eq('user_id', user.user_id);
          
          if (updateError) {
            console.error(`Error updating balance for user ${user.user_id}:`, updateError);
            errorCount++;
            return;
          }
          
          console.log(`Updated balance for user ${user.user_id}: ${balance} TON`);
          successCount++;
        } catch (error) {
          console.error(`Error processing user ${user.user_id}:`, error);
          errorCount++;
        }
      });
      
      // Wait for all users in the batch to be processed
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Log the update to the database for tracking
    const logDetails = `Updated TON balances for ${successCount} users with ${errorCount} errors`;
    await logCronExecution('update_ton_balances', successCount, errorCount, logDetails);
    
    return NextResponse.json({
      message: 'TON balance update completed',
      summary: {
        total: users.length,
        success: successCount,
        errors: errorCount
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Try to log the error
    try {
      await logCronExecution('update_ton_balances', 0, 1, `Failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// This route should be called by a cron job service like Vercel Cron Jobs
// Example URL: https://your-app.vercel.app/api/cron/update-ton-balances?key=your-secret-key 