# MUSKY Token Airdrop Bot 🚀

A Telegram bot for managing MUSKY token airdrops and referrals.

## Features

- 🎁 Referral system with bonus tokens
- 💰 Token balance tracking
- ✅ Channel and group verification
- 🐦 Twitter follow verification
- 💸 Token withdrawal system
- ⏳ Launch countdown timer
- 📊 User statistics tracking
- ⛏️ Mining system with GPU purchases
- 💎 Real-time SOL mining rewards

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the environment:
   - Update environment variables in `.env.local`
   - Customize settings as needed

3. Run the development server:
   ```bash
   npm run dev
   ```

## Bot Commands

- `/start` - Start the bot and begin verification process
- Use inline buttons for all other functions:
  - Refer and Earn
  - Check Balance
  - About MUSKY
  - Withdraw Tokens
  - Mining Farm

## Database

User data is stored in Supabase with the following information:
- User ID
- Username
- Referral count
- Token balance
- Solana address
- Verification status
- Join timestamp
- Mining equipment
- Mining rate
- Solana balance

## Deployment to Vercel

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Git](https://git-scm.com/downloads) installed on your machine
3. [Vercel CLI](https://vercel.com/docs/cli) (optional)

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Deploy using Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: npm run build
     - Output Directory: .next
   - Add Environment Variables:
     - Copy all variables from `.env.production`
     - Update `NEXT_PUBLIC_API_URL` to your Vercel deployment URL
   - Click "Deploy"

3. **Deploy using Vercel CLI (Alternative)**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

4. **After Deployment**
   - Update your Telegram Mini App URL to point to your Vercel deployment
   - Test all functionality in production environment

### Updating Your Deployment

To update your deployment after making changes:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

2. Vercel will automatically redeploy if you've set up automatic deployments.

3. Or manually redeploy:
   ```bash
   vercel --prod
   ```