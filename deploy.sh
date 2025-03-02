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
    echo "   - CRON_SECRET_KEY"
    echo ""
    echo "📱 To set up your Telegram Mini App:"
    echo "   1. Go to @BotFather on Telegram"
    echo "   2. Use /mybots and select your bot"
    echo "   3. Go to Bot Settings > Menu Button > Configure Menu Button"
    echo "   4. Set the button text to 'Open Mini App'"
    echo "   5. Set the URL to your Vercel deployment URL"
    echo ""
    echo "⏱️ Daily broadcasts are configured to run at 12:00 UTC every day"
else
    echo "❌ Deployment failed. Please check the errors and try again."
    exit 1
fi

echo "🎉 Deployment process completed!" 