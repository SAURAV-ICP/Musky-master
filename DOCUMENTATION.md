# Musky Mini App Documentation

## Overview

The Musky mini app is a Telegram-based application that allows users to mine virtual Solana tokens through a GPU mining simulation. Users can purchase virtual GPUs using TON, Telegram Stars, or MUSKY tokens, and earn Solana rewards over time.

## Architecture

The application is built using:
- Next.js for the frontend and API routes
- Supabase for database storage
- Telegram Mini App API for integration with Telegram
- TON Connect for wallet integration

## Core Features

### User Authentication

The app authenticates users through the Telegram Mini App API. User identification is handled in `src/contexts/UserContext.tsx`, which:

1. Extracts the Telegram user ID from the WebApp environment
2. Creates a new user record if the user doesn't exist
3. Manages user data including balances, mining equipment, and admin status

### Mining System

The mining system is implemented in `src/app/mining/page.tsx` and allows users to:

1. Purchase virtual GPUs using different payment methods (TON, Stars, MUSKY)
2. Accumulate Solana rewards based on their mining equipment
3. Track mining progress and earnings in real-time

The mining rate is calculated based on the user's active GPUs, with a maximum of 2 GPUs per type and 8 GPUs total.

### TON Wallet Integration

The TON wallet integration allows users to connect their TON wallets directly through the Telegram Mini App. This feature is implemented in:

1. `src/components/common/WalletConnect.tsx`: Handles wallet connection and displays wallet information
2. `src/contexts/UserContext.tsx`: Provides the `updateWalletAddress` function to store wallet addresses
3. `src/app/api/user/update-wallet/route.ts`: API endpoint for updating wallet addresses in the database

The integration uses the TON Connect protocol, which is configured in:
- `public/tonconnect-manifest.json`: Defines the app's information for TON Connect
- `src/components/Layout.tsx`: Provides the TON Connect UI provider to the app

When a user connects their wallet:
1. The wallet address is stored in the `ton_address` field in the database
2. The wallet balance is displayed in the UI
3. The address can be used for payments and token transfers

### API Endpoints

#### Mining GPUs API (`/api/mining/gpus`)

- **GET**: Fetches user mining data including GPUs, mining rates, and balances
- Handles admin users differently, providing them with predefined mining rates

#### Debug API (`/api/debug/user`)

- **GET**: Returns detailed user information for debugging authentication issues
- Includes admin status verification and environment details

#### Admin Fix Status API (`/api/admin/fix-status`)

- **POST**: Allows fixing admin status for users
- Restricted to updating only if the user ID matches the admin ID

#### Update Wallet API (`/api/user/update-wallet`)

- **POST**: Updates the user's TON wallet address in the database
- Stores the address in the `ton_address` field
- Also updates the `telegram_id` field if it's not set

## Payment Processing

The app integrates with Telegram's payment system to handle purchases using:
- TON cryptocurrency
- Telegram Stars
- MUSKY tokens (internal currency)

Payment processing is handled by the `PaymentProcessor` component.

## Admin Features

Admin users (identified by matching the `ADMIN_ID` environment variable) have special privileges:
- Access to admin-only UI elements
- Higher mining rates
- Ability to broadcast messages to all users

## User Data Structure

```typescript
interface User {
  stars_balance: number;
  user_id: string;
  username: string;
  balance: number;
  solana_balance: number;
  energy: number;
  spin_energy: number;
  last_spin_energy_reset: string | null;
  last_energy_reset: string | null;
  last_tap_time: string | null;
  created_at: string;
  updated_at: string;
  level: string;
  is_admin: boolean;
  solana_address: string | null;
  ton_address: string | null;
  mining_rate: number;
  telegram_id: string | null;
}
```

## GPU Data Structure

```typescript
interface GPU {
  id: number;
  name: string;
  image: string;
  hashrate: string;
  miningRatePerDay: number;
  duration: string;
  price: {
    ton: number;
    stars: number;
    musky?: number;
  };
}
```

## TON Connect Integration

The TON Connect integration allows users to connect their TON wallets to the app. The integration is configured in:

```json
// public/tonconnect-manifest.json
{
  "url": "https://your-app-domain.com",
  "name": "Musky Mini App",
  "iconUrl": "https://your-app-domain.com/logo.png",
  "termsOfUseUrl": "https://your-app-domain.com/terms",
  "privacyPolicyUrl": "https://your-app-domain.com/privacy"
}
```

The wallet connection flow is:
1. User clicks "Connect Wallet" button
2. TON Connect UI opens a modal with available wallets
3. User selects a wallet and authorizes the connection
4. Wallet address is stored in the database
5. Wallet balance is displayed in the UI

## Debugging

For debugging authentication issues, navigate to the `/debug` page, which provides:
- User identification information
- Admin status verification
- Tools to fix common issues

## Environment Variables

The application requires the following environment variables:

- `NEXT_PUBLIC_ADMIN_ID`: The Telegram user ID of the admin user
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_TON_ADDRESS`: Your TON wallet address for receiving payments
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `CRON_SECRET_KEY`: Secret key for scheduled broadcasts

## Deployment

The app is designed to be deployed as a Telegram Mini App. The deployment process involves:

1. Building the Next.js application
2. Deploying to a hosting service (Vercel recommended)
3. Registering the app with BotFather in Telegram
4. Configuring the Mini App settings in BotFather
5. Setting up TON payments in BotFather
6. Updating the TON Connect manifest with your app's domain

## Future Features

### Token Locking System

A planned feature to allow users to lock their MUSKY tokens for compound interest/rewards:
- Different lock periods with varying reward rates
- Early withdrawal penalties
- Reward visualization

### Daily Claim System

A daily reward system with increasing rewards for consecutive claims:
- Streak-based rewards
- Notification system for available claims
- Bonus rewards for premium users

### MUSKY Token Economy

Expansion of the MUSKY token utility:
- Purchasing GPUs with MUSKY tokens
- Trading MUSKY for other currencies
- Special MUSKY-only features and equipment

## Troubleshooting

### Common Issues

1. **User Authentication Failures**
   - Check the Telegram WebApp environment
   - Verify URL parameters
   - Use the debug page to diagnose issues

2. **Mining Rate Issues**
   - Verify GPU ownership in the database
   - Check active GPU count
   - Confirm mining rate calculations

3. **Payment Processing Errors**
   - Verify Telegram payment configuration
   - Check currency conversion rates
   - Ensure proper callback handling

4. **Wallet Connection Issues**
   - Check that the TON Connect manifest is correctly configured
   - Verify that the TON Connect UI provider is properly initialized
   - Ensure the user has a compatible TON wallet installed

## Best Practices

1. **User Experience**
   - Implement smooth animations for all interactions
   - Provide clear feedback for user actions
   - Maintain a premium UI with consistent design language

2. **Performance**
   - Optimize API calls to minimize latency
   - Implement efficient state management
   - Use caching for frequently accessed data

3. **Security**
   - Validate all user inputs
   - Implement proper authentication checks
   - Protect sensitive admin functions
   - Securely handle wallet connections and transactions

## Contributing

To contribute to the Musky mini app:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Submit a pull request with detailed description

## License

The Musky mini app is proprietary software. All rights reserved. 