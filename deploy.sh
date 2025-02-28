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
else
    echo "❌ Deployment failed. Please check the errors and try again."
    exit 1
fi

echo "🎉 Deployment process completed!" 