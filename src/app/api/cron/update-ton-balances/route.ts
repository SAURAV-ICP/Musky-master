import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// TON API endpoint (using TON Center API)
const TON_API_URL = 'https://toncenter.com/api/v2/getAddressBalance';
const TON_API_KEY = process.env.TON_API_KEY || ''; // Optional API key for higher rate limits

// Secret key for securing the cron job
const CRON_SECRET_KEY = process.env.CRON_SECRET_KEY;

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

export async function GET(request: Request) {
  // Verify the secret key to secure the cron job
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get('key');
  
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
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'update_ton_balances',
        success_count: successCount,
        error_count: errorCount,
        details: `Updated TON balances for ${successCount} users with ${errorCount} errors`
      });
    
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
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// This route should be called by a cron job service like Vercel Cron Jobs
// Example URL: https://your-app.vercel.app/api/cron/update-ton-balances?key=your-secret-key 