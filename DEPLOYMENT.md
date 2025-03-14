# Musky Mini App Deployment Checklist

This document provides a step-by-step guide for deploying the Musky Mini App to Vercel.

## Prerequisites

- Node.js 16+ installed
- npm or yarn installed
- Vercel CLI installed (`npm install -g vercel`)
- Supabase account with a project set up
- Telegram Bot created via BotFather

## Environment Variables

Ensure you have the following environment variables ready:

### Required
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_TON_ADDRESS`: Your TON wallet address for payments
- `CRON_SECRET_KEY`: A secret key to secure cron job endpoints

### Recommended
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)
- `TON_API_KEY`: API key for TON Center API (optional, for higher rate limits)
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `NEXT_PUBLIC_ADMIN_ID`: Your Telegram user ID for admin access

## Deployment Steps

### 1. Prepare Your Environment

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/yourusername/musky-mini-app.git
cd musky-mini-app

# Install dependencies
npm install

# Install required dependencies for scripts
npm install dotenv axios @supabase/supabase-js --save
```

### 2. Set Up Environment Variables

Create a `.env.local` file with your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
NEXT_PUBLIC_TON_ADDRESS='your-ton-wallet-address'
CRON_SECRET_KEY='your-secret-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
TON_API_KEY='your-ton-api-key'
TELEGRAM_BOT_TOKEN='your-telegram-bot-token'
NEXT_PUBLIC_ADMIN_ID='your-telegram-id'
```

### 3. Set Up Supabase for Migrations

```bash
# Set up the exec_sql function for migrations
node scripts/setup_migration_function.js
```

### 4. Deploy to Vercel

#### Option 1: Using the Automated Script

```bash
# Run the deployment script
node scripts/deploy_to_vercel.js
```

This script will:
- Check for required dependencies
- Verify environment variables
- Create a `.env.production` file
- Deploy to Vercel
- Update the TonConnect manifest with your deployment URL

#### Option 2: Manual Deployment

```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy to Vercel
vercel --prod
```

### 5. Run Database Migrations

After deployment, run the database migrations:

```bash
# Run the TON wallet migration
node scripts/run_ton_migration.js

# Run the cron logs migration
node scripts/run_migration.js migrations/add_cron_logs_table.sql
```

### 6. Configure Telegram Bot

1. Go to @BotFather on Telegram
2. Use /mybots and select your bot
3. Configure the Menu Button:
   - Go to Bot Settings > Menu Button > Configure Menu Button
   - Set the button text to 'Open Mini App'
   - Set the URL to your Vercel deployment URL

4. Enable TON payments:
   - Go to Bot Settings > Payments
   - Select TON as the payment provider

5. Set up Web App authentication:
   - Use /setdomain to link your domain to your bot
   - Enter your Vercel deployment domain (without https://)

### 7. Update TonConnect Manifest

Ensure your `public/tonconnect-manifest.json` file has the correct deployment URL:

```json
{
  "url": "https://your-app-domain.vercel.app",
  "name": "Musky Mini App",
  "iconUrl": "https://scarlet-traditional-jaguar-217.mypinata.cloud/ipfs/bafybeifvdrdlcfbykwi76j7r5l6u6k62z3fa3ibbgjuhuhmgu3gowhnhzi",
  "termsOfUseUrl": "https://your-app-domain.vercel.app/terms",
  "privacyPolicyUrl": "https://your-app-domain.vercel.app/privacy"
}
```

### 8. Test Your Deployment

1. Open your bot in Telegram
2. Click the Menu Button to launch the Mini App
3. Verify that your Telegram ID is correctly detected
4. Test the TON wallet connection:
   - Click the 'Connect Wallet' button
   - Select a wallet from the list (e.g., Tonkeeper, Tonhub)
   - Authorize the connection in your wallet app
   - Verify that your wallet address appears in the UI
   - Check that the address is stored in the database

5. Test TON balance updates:
   - Run the update script manually: `node scripts/update_ton_balances.js`
   - Verify that balances are updated in the database
   - Test the cron job endpoint: `curl -X GET https://your-app-domain.vercel.app/api/cron/update-ton-balances?key=your-secret-key`

## Troubleshooting

### Common Issues

1. **Build fails with "supabaseKey is required"**:
   - Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in your Vercel environment variables
   - If using `SUPABASE_SERVICE_ROLE_KEY`, ensure it's also set

2. **Cron jobs not running**:
   - Verify `CRON_SECRET_KEY` is set correctly
   - Check the cron job configuration in `vercel.json`
   - Test the cron job endpoint manually

3. **TON wallet connection fails**:
   - Ensure `tonconnect-manifest.json` has the correct deployment URL
   - Verify the domain is set up correctly in BotFather

4. **Database migrations fail**:
   - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check that the `exec_sql` function is created in Supabase
   - Run `node scripts/setup_migration_function.js` to set up the function

## Additional Resources

- [TON Wallet Integration Documentation](docs/TON_WALLET_INTEGRATION.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Telegram Mini App Documentation](https://core.telegram.org/bots/webapps)
- [TON Connect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview) 