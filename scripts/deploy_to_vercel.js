#!/usr/bin/env node

/**
 * This script deploys the Musky Mini App to Vercel with all necessary environment variables.
 * 
 * Usage:
 * node scripts/deploy_to_vercel.js
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function main() {
  console.log('🚀 Musky Mini App Vercel Deployment');
  console.log('==================================\n');
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('✅ Vercel CLI is installed');
  } catch (error) {
    console.error('❌ Vercel CLI is not installed. Installing...');
    try {
      execSync('npm install -g vercel', { stdio: 'inherit' });
      console.log('✅ Vercel CLI installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install Vercel CLI:', installError.message);
      process.exit(1);
    }
  }
  
  // Check if user is logged in to Vercel
  try {
    const whoamiOutput = execSync('vercel whoami', { encoding: 'utf8' });
    console.log(`✅ Logged in to Vercel as: ${whoamiOutput.trim()}`);
  } catch (error) {
    console.log('❌ Not logged in to Vercel. Please log in:');
    try {
      execSync('vercel login', { stdio: 'inherit' });
    } catch (loginError) {
      console.error('❌ Failed to log in to Vercel:', loginError.message);
      process.exit(1);
    }
  }
  
  // Check if required dependencies are installed
  console.log('\n📦 Checking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'axios', 'dotenv'];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}. Installing...`);
    try {
      execSync(`npm install ${missingDeps.join(' ')} --save`, { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
    } catch (depError) {
      console.error('❌ Failed to install dependencies:', depError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ All required dependencies are installed');
  }
  
  // Check if required environment variables are set
  console.log('\n🔐 Checking environment variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_TON_ADDRESS',
    'CRON_SECRET_KEY'
  ];
  
  const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'TON_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'NEXT_PUBLIC_ADMIN_ID'
  ];
  
  // Load environment variables from .env files
  const envVars = {};
  
  // Try to load from .env
  try {
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
  }
  
  // Try to load from .env.local
  try {
    if (fs.existsSync('.env.local')) {
      const envLocalContent = fs.readFileSync('.env.local', 'utf8');
      envLocalContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message);
  }
  
  // Check required environment variables
  const missingEnvVars = [];
  for (const envVar of requiredEnvVars) {
    if (!envVars[envVar] && !process.env[envVar]) {
      missingEnvVars.push(envVar);
    }
  }
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.log('Please set these variables before deploying.');
    
    const setNow = await prompt('Would you like to set them now? (y/n): ');
    if (setNow.toLowerCase() !== 'y') {
      console.log('Deployment aborted. Please set the required environment variables and try again.');
      process.exit(1);
    }
    
    // Prompt for missing environment variables
    for (const envVar of missingEnvVars) {
      const value = await prompt(`Enter value for ${envVar}: `);
      if (!value) {
        console.error(`❌ ${envVar} is required`);
        process.exit(1);
      }
      envVars[envVar] = value;
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Check optional environment variables
  const missingOptionalEnvVars = [];
  for (const envVar of optionalEnvVars) {
    if (!envVars[envVar] && !process.env[envVar]) {
      missingOptionalEnvVars.push(envVar);
    }
  }
  
  if (missingOptionalEnvVars.length > 0) {
    console.log(`⚠️ Missing optional environment variables: ${missingOptionalEnvVars.join(', ')}`);
    
    const setOptional = await prompt('Would you like to set them now? (y/n): ');
    if (setOptional.toLowerCase() === 'y') {
      // Prompt for missing optional environment variables
      for (const envVar of missingOptionalEnvVars) {
        const value = await prompt(`Enter value for ${envVar} (optional, press Enter to skip): `);
        if (value) {
          envVars[envVar] = value;
        }
      }
    }
  }
  
  // Create .env.production file for Vercel
  console.log('\n📝 Creating .env.production file for Vercel...');
  
  let envFileContent = '';
  for (const [key, value] of Object.entries(envVars)) {
    envFileContent += `${key}='${value}'\n`;
  }
  
  fs.writeFileSync('.env.production', envFileContent);
  console.log('✅ .env.production file created successfully');
  
  // Check if vercel.json exists
  console.log('\n📝 Checking vercel.json configuration...');
  
  if (!fs.existsSync('vercel.json')) {
    console.log('⚠️ vercel.json not found. Creating default configuration...');
    
    const vercelConfig = {
      "buildCommand": "npm run build",
      "devCommand": "npm run dev",
      "installCommand": "npm install",
      "framework": "nextjs",
      "outputDirectory": ".next",
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "Access-Control-Allow-Origin",
              "value": "*"
            },
            {
              "key": "Access-Control-Allow-Methods",
              "value": "GET, POST, PUT, DELETE, OPTIONS"
            },
            {
              "key": "Access-Control-Allow-Headers",
              "value": "X-Requested-With, Content-Type, Accept"
            }
          ]
        }
      ],
      "crons": [
        {
          "path": "/api/admin/scheduled-broadcast?key=$CRON_SECRET_KEY",
          "schedule": "0 12 * * *"
        },
        {
          "path": "/api/cron/update-ton-balances?key=$CRON_SECRET_KEY",
          "schedule": "0 */6 * * *"
        }
      ]
    };
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json created successfully');
  } else {
    console.log('✅ vercel.json exists');
  }
  
  // Check if migrations directory exists
  console.log('\n📝 Checking migrations directory...');
  
  if (!fs.existsSync('migrations')) {
    console.log('⚠️ migrations directory not found. Creating...');
    fs.mkdirSync('migrations', { recursive: true });
  }
  
  // Check if required migration files exist
  const requiredMigrations = [
    'add_ton_wallet_support.sql',
    'add_cron_logs_table.sql'
  ];
  
  for (const migration of requiredMigrations) {
    const migrationPath = path.join('migrations', migration);
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      console.log('Please make sure all required migration files exist before deploying.');
      process.exit(1);
    }
  }
  
  console.log('✅ All required migration files exist');
  
  // Check if scripts directory exists
  console.log('\n📝 Checking scripts directory...');
  
  if (!fs.existsSync('scripts')) {
    console.log('⚠️ scripts directory not found. Creating...');
    fs.mkdirSync('scripts', { recursive: true });
  }
  
  // Check if required script files exist
  const requiredScripts = [
    'run_migration.js',
    'run_ton_migration.js',
    'update_ton_balances.js',
    'test_ton_wallet.js'
  ];
  
  for (const script of requiredScripts) {
    const scriptPath = path.join('scripts', script);
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Script file not found: ${scriptPath}`);
      console.log('Please make sure all required script files exist before deploying.');
      process.exit(1);
    }
  }
  
  console.log('✅ All required script files exist');
  
  // Deploy to Vercel
  console.log('\n🚀 Deploying to Vercel...');
  
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment successful!');
  } catch (deployError) {
    console.error('❌ Deployment failed:', deployError.message);
    process.exit(1);
  }
  
  // Get deployment URL
  console.log('\n🔍 Getting deployment URL...');
  
  let deploymentUrl = '';
  try {
    deploymentUrl = execSync('vercel --prod --confirm', { encoding: 'utf8' }).trim();
    console.log(`✅ Deployment URL: ${deploymentUrl}`);
  } catch (error) {
    console.log('⚠️ Could not get deployment URL automatically.');
    deploymentUrl = await prompt('Please enter your deployment URL: ');
  }
  
  if (deploymentUrl) {
    // Update tonconnect-manifest.json with deployment URL
    console.log('\n📝 Updating tonconnect-manifest.json with deployment URL...');
    
    const manifestPath = 'public/tonconnect-manifest.json';
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.url = deploymentUrl;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ tonconnect-manifest.json updated successfully');
        
        // Redeploy to apply changes
        console.log('\n🚀 Redeploying to apply changes...');
        execSync('vercel --prod', { stdio: 'inherit' });
      } catch (error) {
        console.error('❌ Error updating tonconnect-manifest.json:', error.message);
      }
    } else {
      console.log('⚠️ tonconnect-manifest.json not found. Creating...');
      
      const manifest = {
        "url": deploymentUrl,
        "name": "Musky Mini App",
        "iconUrl": "https://scarlet-traditional-jaguar-217.mypinata.cloud/ipfs/bafybeifvdrdlcfbykwi76j7r5l6u6k62z3fa3ibbgjuhuhmgu3gowhnhzi",
        "termsOfUseUrl": `${deploymentUrl}/terms`,
        "privacyPolicyUrl": `${deploymentUrl}/privacy`
      };
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✅ tonconnect-manifest.json created successfully');
      
      // Redeploy to apply changes
      console.log('\n🚀 Redeploying to apply changes...');
      execSync('vercel --prod', { stdio: 'inherit' });
    }
  }
  
  console.log('\n🎉 Deployment process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run database migrations:');
  console.log('   - node scripts/run_ton_migration.js');
  console.log('   - node scripts/run_migration.js migrations/add_cron_logs_table.sql');
  console.log('2. Configure your Telegram bot in BotFather:');
  console.log('   - Set up the Menu Button to point to your deployment URL');
  console.log('   - Enable TON payments by selecting TON as the payment provider');
  console.log('3. Test your deployment:');
  console.log('   - Open your bot in Telegram');
  console.log('   - Test the TON wallet connection');
  console.log('   - Test the payment processing');
  
  rl.close();
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 