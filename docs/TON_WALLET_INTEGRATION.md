# TON Wallet Integration

This document provides detailed information about the TON wallet integration in the Musky Mini App.

## Overview

The TON wallet integration allows users to:

1. Connect their TON wallets to the Musky Mini App
2. View their TON balance within the app
3. Make payments using TON for various in-app purchases
4. Store their wallet addresses securely in the database

## Setup Instructions

### 1. Environment Variables

The following environment variables are required for the TON wallet integration:

- `NEXT_PUBLIC_TON_ADDRESS`: Your TON wallet address for receiving payments
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)
- `CRON_SECRET_KEY`: A secret key to secure cron job endpoints
- `TON_API_KEY` (optional): API key for TON Center API to increase rate limits

You can set these variables using our setup script:

```bash
node scripts/setup_vercel_env.js
```

### 2. Database Migration

Run the TON wallet migration to add the necessary database columns:

```bash
node scripts/run_ton_migration.js
```

This will add the following columns to the `users` table:
- `ton_address`: Stores the user's TON wallet address
- `ton_balance`: Stores the user's TON balance
- `ton_address_updated_at`: Timestamp of when the address was last updated

### 3. TonConnect Manifest

Update the `public/tonconnect-manifest.json` file with your app's domain:

```json
{
  "url": "https://your-app-domain.com",
  "name": "Musky Mini App",
  "iconUrl": "https://scarlet-traditional-jaguar-217.mypinata.cloud/ipfs/bafybeifvdrdlcfbykwi76j7r5l6u6k62z3fa3ibbgjuhuhmgu3gowhnhzi",
  "termsOfUseUrl": "https://your-app-domain.com/terms",
  "privacyPolicyUrl": "https://your-app-domain.com/privacy"
}
```

### 4. Enable TON Payments in BotFather

1. Go to @BotFather on Telegram
2. Use /mybots and select your bot
3. Go to Payments
4. Select TON as the payment provider
5. This allows users to pay with TON directly in your Mini App

### 5. Cron Jobs for Balance Updates

The TON balance update cron job is configured in `vercel.json` to run every 6 hours. Make sure your `CRON_SECRET_KEY` is set in the environment variables.

You can also run the balance update manually:

```bash
node scripts/update_ton_balances.js
```

Or test the cron job endpoint:

```bash
curl -X GET https://your-app-domain.com/api/cron/update-ton-balances?key=your-secret-key
```

## Implementation Details

### Components

- `WalletConnect.tsx`: Component for connecting TON wallets
- `PaymentProcessor.tsx`: Component for processing TON payments

### API Routes

- `/api/user/update-wallet`: Updates a user's TON wallet address
- `/api/payments/process`: Processes payments made with TON
- `/api/cron/update-ton-balances`: Updates TON balances for all users

### Scripts

- `scripts/run_ton_migration.js`: Runs the database migration for TON wallet support
- `scripts/update_ton_balances.js`: Updates TON balances for all users
- `scripts/test_ton_wallet.js`: Tests the TON wallet integration

## Testing

### Wallet Connection

1. Open the Musky Mini App in Telegram
2. Click the "Connect Wallet" button
3. Select a wallet from the list (e.g., Tonkeeper, Tonhub)
4. Authorize the connection in your wallet app
5. Verify that your wallet address appears in the UI
6. Check that the address is stored in the database

### TON Payments

1. Try to purchase an item in the app
2. Select TON as the payment method
3. Confirm the payment in your wallet app
4. Verify that the payment is processed correctly
5. Check that the item is added to your account

### Balance Updates

1. Run the balance update script: `node scripts/update_ton_balances.js`
2. Verify that balances are updated in the database
3. Check that the balance is displayed correctly in the UI

## Troubleshooting

### Common Issues

1. **Wallet connection fails**: Make sure your `tonconnect-manifest.json` is correctly configured with your app's domain.

2. **Payments not processing**: Ensure that TON payments are enabled in BotFather and that your `NEXT_PUBLIC_TON_ADDRESS` is set correctly.

3. **Balance updates not working**: Check that your `SUPABASE_SERVICE_ROLE_KEY` is set correctly and that the TON API is accessible.

4. **Cron job failing**: Verify that your `CRON_SECRET_KEY` is set correctly and that the cron job URL is properly configured in `vercel.json`.

### Debugging

You can use the test script to verify the TON wallet integration:

```bash
node scripts/test_ton_wallet.js
```

This will check if a user exists, update their TON wallet address, and verify the update.

## Resources

- [TON Connect Documentation](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [TON Center API Documentation](https://toncenter.com/api/v2/)
- [Telegram Mini App Payments Documentation](https://core.telegram.org/bots/webapps#payments) 