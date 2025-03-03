#!/bin/bash

# Musky Deployment Script for Vercel

echo "🚀 Starting Musky deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Your app is now live on Vercel!"
    echo "⚠️ Remember to update your NEXT_PUBLIC_API_URL in the Vercel dashboard to match your deployment URL."
    echo "⚠️ Also update your Telegram Mini App URL to point to your Vercel deployment."
    echo ""
    echo "🔐 Important: Make sure the following environment variables are set in your Vercel project:"
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - NEXT_PUBLIC_ADMIN_ID"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - NEXT_PUBLIC_API_URL"
    echo "   - NEXT_PUBLIC_TON_ADDRESS"
    echo "   - CRON_SECRET_KEY (for securing cron jobs)"
    echo "   - SUPABASE_SERVICE_ROLE_KEY (for database migrations and cron jobs)"
    echo "   - TON_API_KEY (optional, for higher rate limits with TON Center API)"
    echo ""
    echo "📱 To set up your Telegram Mini App:"
    echo "   1. Go to @BotFather on Telegram"
    echo "   2. Use /mybots and select your bot"
    echo "   3. Go to Bot Settings > Menu Button > Configure Menu Button"
    echo "   4. Set the button text to 'Open Mini App'"
    echo "   5. Set the URL to your Vercel deployment URL"
    echo ""
    echo "🔄 To set up Web App authentication:"
    echo "   1. Make sure your bot has a username set in BotFather"
    echo "   2. In BotFather, use /setdomain to link your domain to your bot"
    echo "   3. Enter your Vercel deployment domain (without https://)"
    echo "   4. This ensures user authentication works correctly"
    echo ""
    echo "💰 To enable TON payments and wallet integration:"
    echo "   1. In BotFather, use /mybots > Your Bot > Payments"
    echo "   2. Select TON as the payment provider"
    echo "   3. This allows users to pay with TON directly in your Mini App"
    echo "   4. Update the public/tonconnect-manifest.json file with your app's domain:"
    echo "      {\"url\":\"https://your-app-domain.com\",\"name\":\"Musky Mini App\"}"
    echo "   5. Make sure the NEXT_PUBLIC_TON_ADDRESS environment variable is set to your wallet address"
    echo "   6. Run the database migrations to add TON wallet support:"
    echo "      - node scripts/run_ton_migration.js"
    echo "   7. Test the wallet connection by clicking the 'Connect Wallet' button in the app"
    echo ""
    echo "⏱️ To set up cron jobs for automatic updates:"
    echo "   1. Set up the cron_logs table by running the migration:"
    echo "      - node scripts/run_migration.js migrations/add_cron_logs_table.sql"
    echo "   2. In Vercel, go to Settings > Cron Jobs"
    echo "   3. Add a new cron job for updating TON balances:"
    echo "      - Name: Update TON Balances"
    echo "      - Schedule: 0 */6 * * * (every 6 hours)"
    echo "      - Command: curl -X GET https://your-app-domain.com/api/cron/update-ton-balances?key=\$CRON_SECRET_KEY"
    echo "   4. Make sure the CRON_SECRET_KEY environment variable is set to a secure random string"
    echo "   5. You can monitor cron job executions in the cron_logs table"
    echo ""
    echo "📢 Scheduled broadcasts are configured to run at 12:00 UTC every day"
    echo "   - Users will receive promotional messages to collect MUSKY tokens"
    echo "   - Make sure your bot has permission to message users (they must have started the bot)"
    echo ""
    echo "🔍 Testing your deployment:"
    echo "   1. Open your bot in Telegram"
    echo "   2. Click the Menu Button to launch the Mini App"
    echo "   3. Verify that your Telegram ID is correctly detected"
    echo "   4. Check that your MUSKY balance is displayed correctly"
    echo "   5. Test TON wallet connection:"
    echo "      - Click the 'Connect Wallet' button"
    echo "      - Select a wallet from the list (e.g., Tonkeeper, Tonhub)"
    echo "      - Authorize the connection in your wallet app"
    echo "      - Verify that your wallet address appears in the UI"
    echo "      - Check that the address is stored in the database"
    echo "   6. Test TON balance updates:"
    echo "      - Run the update script manually: node scripts/update_ton_balances.js"
    echo "      - Verify that balances are updated in the database"
    echo "      - Test the cron job endpoint: curl -X GET https://your-app-domain.com/api/cron/update-ton-balances?key=your-secret-key"
else
    echo "❌ Deployment failed. Please check the errors and try again."
    exit 1
fi

echo "🎉 Deployment process completed!" 