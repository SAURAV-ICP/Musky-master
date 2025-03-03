// Script to run the TON wallet database migration
// Run with: node scripts/run_ton_migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to run migrations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTonMigration() {
  console.log('🚀 Running TON wallet database migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_ton_wallet_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Execute the SQL using Supabase's REST API
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });
    
    if (error) {
      console.error('❌ Error executing migration:', error.message);
      return;
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Verify the migration by checking if the ton_address column exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('ton_address, ton_balance')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('column "ton_address" does not exist')) {
        console.error('❌ Migration verification failed: ton_address column not found');
      } else if (tableError.message.includes('column "ton_balance" does not exist')) {
        console.error('❌ Migration verification failed: ton_balance column not found');
      } else {
        console.error('❌ Error verifying migration:', tableError.message);
      }
      return;
    }
    
    console.log('✅ Migration verification successful: ton_address and ton_balance columns exist');
    console.log('🎉 TON wallet database migration completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the migration
runTonMigration(); 