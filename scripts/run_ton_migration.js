#!/usr/bin/env node

/**
 * This script runs the TON wallet migration on the Supabase database.
 * It adds the necessary columns to the users table for TON wallet integration.
 * 
 * Usage:
 * node scripts/run_ton_migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to run migrations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTonMigration() {
  try {
    console.log('📦 Running TON wallet migration...');
    
    // Read the SQL file
    const sqlFilePath = path.resolve(process.cwd(), 'migrations/add_ton_wallet_support.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ Migration file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL command via Supabase REST API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ TON wallet migration completed successfully');
    
    // Verify the migration by checking if the columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('ton_address, ton_balance')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Failed to verify migration:', columnsError);
    } else {
      console.log('✅ Verified that ton_address and ton_balance columns exist in the users table');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

runTonMigration(); 