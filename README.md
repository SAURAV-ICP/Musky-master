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
- 🔒 Token staking with compound interest
- 📅 Daily claim system with increasing rewards
- 📣 Admin broadcast messaging system
- 🔔 Balance-based notification popups
- 👛 TON wallet integration for payments and token management

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

4. Set up the database:
   - Run the migrations in the `migrations` folder
   - The `add_staking_and_daily_claims.sql` file contains the latest schema updates

## Bot Commands

- `/start` - Start the bot and begin verification process
- Use inline buttons for all other functions:
  - Refer and Earn
  - Check Balance
  - About MUSKY
  - Withdraw Tokens
  - Mining Farm
  - Staking
  - Daily Rewards

## Database

User data is stored in Supabase with the following information:
- User ID
- Username
- Referral count
- Token balance
- Solana address
- TON address
- Verification status
- Join timestamp
- Mining equipment
- Mining rate
- Solana balance
- TON balance
- Staking positions
- Daily claim streak

## New Features

### Token Staking System

The staking system allows users to lock their MUSKY tokens for a fixed period to earn rewards:

- Multiple staking plans with different durations and APY rates
- Early withdrawal with penalty fees
- Compound interest calculation
- Visual representation of staking positions

### Daily Claim System

The daily claim system encourages user retention with increasing rewards:

- Streak-based rewards that increase over time
- Special bonuses for weekly and monthly milestones
- Visual calendar showing upcoming rewards
- Countdown timer for next available claim

### Admin Broadcast System

The admin broadcast system allows administrators to send messages to all users:

- Create messages with different types (info, warning, success, error)
- Set expiration dates for messages
- Activate/deactivate messages as needed
- Track message history

### Balance Popup Notifications

The balance popup system shows targeted messages to users with specific balances:

- Configurable minimum balance threshold
- Support for different message types
- One-time display with local storage tracking
- Smooth animations for better user experience

### TON Wallet Integration

The TON wallet integration allows users to connect their TON wallets for payments and token management:

- Connect TON wallets directly through the Telegram Mini App
- View wallet balance and address
- Store wallet addresses in the database
- Use TON for payments within the app
- Secure wallet connection using TON Connect protocol

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
     - Set `NEXT_PUBLIC_TON_ADDRESS` to your TON wallet address
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
   - Update the `tonconnect-manifest.json` file with your app's domain
   - Test all functionality in production environment

### Setting Up TON Wallet Integration

1. **Update TON Connect Manifest**
   - Edit the `public/tonconnect-manifest.json` file:
     ```json
     {
       "url": "https://your-app-domain.com",
       "name": "Musky Mini App",
       "iconUrl": "https://your-app-domain.com/logo.png",
       "termsOfUseUrl": "https://your-app-domain.com/terms",
       "privacyPolicyUrl": "https://your-app-domain.com/privacy"
     }
     ```

2. **Enable TON Payments in BotFather**
   - Go to @BotFather on Telegram
   - Use /mybots and select your bot
   - Go to Bot Settings > Payments
   - Select TON as the payment provider

3. **Test Wallet Connection**
   - Open your Mini App in Telegram
   - Click the "Connect Wallet" button
   - Authorize the connection in your TON wallet
   - Verify that your wallet address is displayed correctly
   - Check that the address is stored in the database

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