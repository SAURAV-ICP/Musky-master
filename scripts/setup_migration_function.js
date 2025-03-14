#!/usr/bin/env node

/**
 * This script sets up the exec_sql function in Supabase for running migrations.
 * This must be run before any other migrations.
 * 
 * Usage:
 * node scripts/setup_migration_function.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required to set up migrations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupMigrationFunction() {
  try {
    console.log('📦 Setting up exec_sql function for migrations...');
    
    // Read the SQL file
    const sqlFilePath = path.resolve(process.cwd(), 'migrations/create_exec_sql_function.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ Migration file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Try to use the REST API to execute the SQL directly
    console.log('🔄 Creating exec_sql function using REST API...');
    
    try {
      // Extract the function creation part from the SQL file
      const functionCreationSQL = sqlContent.match(/CREATE OR REPLACE FUNCTION public\.exec_sql[\s\S]*?END;/m)?.[0];
      
      if (!functionCreationSQL) {
        console.error('❌ Could not extract function creation SQL');
        process.exit(1);
      }
      
      // Use the REST API to execute the raw SQL
      const response = await axios({
        method: 'POST',
        url: `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        data: {
          sql_query: functionCreationSQL
        }
      });
      
      console.log('✅ exec_sql function already exists and was updated');
      
    } catch (error) {
      // If the function doesn't exist yet, we need to create it using a raw SQL query
      console.log('⚠️ exec_sql function not found. Creating it using SQL API...');
      
      try {
        // Use the SQL API to execute the raw SQL
        const response = await axios({
          method: 'POST',
          url: `${supabaseUrl}/rest/v1/sql`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Prefer': 'return=minimal'
          },
          data: {
            query: sqlContent
          }
        });
        
        console.log('✅ exec_sql function created successfully');
        
      } catch (sqlError) {
        console.error('❌ Failed to create exec_sql function using SQL API:', sqlError.message);
        
        // Try one more approach - using the Postgres extension
        console.log('⚠️ Trying to create function using Postgres extension...');
        
        try {
          const { data, error } = await supabase.rpc('pgcrypto_extensions');
          
          if (error) {
            throw error;
          }
          
          // Now try to create the function again
          const { data: execData, error: execError } = await supabase.rpc('exec_sql', {
            sql_query: sqlContent
          });
          
          if (execError) {
            throw execError;
          }
          
          console.log('✅ exec_sql function created successfully using Postgres extension');
          
        } catch (pgError) {
          console.error('❌ All attempts to create exec_sql function failed');
          console.error('Please create this function manually in the Supabase SQL editor:');
          console.log(sqlContent);
          process.exit(1);
        }
      }
    }
    
    // Verify the function exists
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: 'SELECT 1 as test;'
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ exec_sql function verified and working');
      console.log('🎉 You can now run migrations using scripts/run_migration.js');
      
    } catch (verifyError) {
      console.error('❌ Failed to verify exec_sql function:', verifyError.message);
      console.error('Please check the function was created correctly');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

setupMigrationFunction(); 