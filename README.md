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

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure the bot:
   - Add your Telegram bot token to `.env`
   - Update admin ID in `.env`
   - Customize settings in `config.py`

3. Run the bot:
   ```bash
   python bot.py
   ```

## Bot Commands

- `/start` - Start the bot and begin verification process
- Use inline buttons for all other functions:
  - Refer and Earn
  - Check Balance
  - About MUSKY
  - Withdraw Tokens

## Database

User data is stored in `users.csv` with the following information:
- User ID
- Username
- Referral count
- Token balance
- Solana address
- Verification status
- Join timestamp