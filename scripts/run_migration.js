#!/usr/bin/env node

/**
 * This script runs SQL migrations on the Supabase database.
 * 
 * Usage:
 * node scripts/run_migration.js path/to/migration.sql
 * 
 * Example:
 * node scripts/run_migration.js migrations/add_cron_logs_table.sql
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get migration file path from command line arguments
const migrationFilePath = process.argv[2];

if (!migrationFilePath) {
  console.error('❌ Migration file path is required');
  console.error('Usage: node scripts/run_migration.js path/to/migration.sql');
  process.exit(1);
}

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

async function runMigration() {
  try {
    console.log(`📦 Running migration: ${migrationFilePath}`);
    
    // Read the SQL file
    const sqlFilePath = path.resolve(process.cwd(), migrationFilePath);
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
    
    console.log('✅ Migration completed successfully');
    console.log(data);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

runMigration(); 