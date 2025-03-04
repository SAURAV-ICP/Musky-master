#!/usr/bin/env node

/**
 * This script helps set up the required environment variables in Vercel
 * for the TON wallet integration and cron jobs.
 * 
 * Usage:
 * 1. Make sure you have the Vercel CLI installed: npm i -g vercel
 * 2. Login to Vercel: vercel login
 * 3. Run this script: node scripts/setup_vercel_env.js
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function main() {
  console.log('🔧 Vercel Environment Variables Setup for TON Wallet Integration');
  console.log('===========================================================\n');
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Vercel CLI is not installed. Please install it with: npm i -g vercel');
    process.exit(1);
  }
  
  console.log('✅ Vercel CLI is installed\n');
  
  // Check if user is logged in
  try {
    const whoamiOutput = execSync('vercel whoami', { encoding: 'utf8' });
    console.log(`✅ Logged in as: ${whoamiOutput.trim()}\n`);
  } catch (error) {
    console.error('❌ Not logged in to Vercel. Please run: vercel login');
    process.exit(1);
  }
  
  // Get project information
  let projectName;
  try {
    const projectInfo = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.vercel', 'project.json'), 'utf8'));
    projectName = projectInfo.projectId;
    console.log(`✅ Found Vercel project: ${projectName}\n`);
  } catch (error) {
    console.log('⚠️ Could not find Vercel project configuration.');
    projectName = await prompt('Please enter your Vercel project name or ID: ');
  }
  
  console.log('\n📋 Required Environment Variables for TON Wallet Integration:');
  console.log('1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL');
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key');
  console.log('3. SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for admin operations)');
  console.log('4. NEXT_PUBLIC_TON_ADDRESS - Your TON wallet address for payments');
  console.log('5. CRON_SECRET_KEY - A secret key to secure cron job endpoints');
  console.log('6. TON_API_KEY - (Optional) API key for TON Center API\n');
  
  // Load existing environment variables from .env files
  const envVars = {};
  
  // Try to load from .env
  try {
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    });
  } catch (error) {
    // .env file might not exist, that's okay
  }
  
  // Try to load from .env.local
  try {
    const envLocalContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    envLocalContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    });
  } catch (error) {
    // .env.local file might not exist, that's okay
  }
  
  // Prompt for each environment variable
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_TON_ADDRESS',
    'CRON_SECRET_KEY',
    'TON_API_KEY'
  ];
  
  for (const varName of requiredVars) {
    const currentValue = envVars[varName] || '';
    const isOptional = varName === 'TON_API_KEY';
    
    const promptText = isOptional
      ? `${varName} (optional, current: ${currentValue || 'not set'}): `
      : `${varName} (current: ${currentValue || 'not set'}): `;
    
    let value = await prompt(promptText);
    
    // Use existing value if empty input
    if (!value && currentValue) {
      value = currentValue;
      console.log(`Using existing value for ${varName}`);
    }
    
    // Skip optional variables if empty
    if (!value && isOptional) {
      console.log(`Skipping optional variable ${varName}`);
      continue;
    }
    
    // Ensure required variables are provided
    if (!value && !isOptional) {
      console.error(`❌ ${varName} is required`);
      process.exit(1);
    }
    
    // Set the environment variable in Vercel
    try {
      console.log(`Setting ${varName} in Vercel...`);
      execSync(`vercel env add ${varName} ${projectName}`, { stdio: 'inherit' });
      console.log(`✅ Successfully set ${varName}`);
    } catch (error) {
      console.error(`❌ Failed to set ${varName}: ${error.message}`);
    }
  }
  
  console.log('\n🔄 Deploying project to apply environment variables...');
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment completed successfully');
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
  }
  
  console.log('\n🎉 Setup completed!');
  console.log('Your TON wallet integration should now be working correctly.');
  console.log('The cron job for updating TON balances will run every 6 hours.');
  
  rl.close();
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 