# Musky Airdrop Telegram Mini App - Context Guide

## Overview
Musky Airdrop is currently a basic Telegram referral bot that rewards users with MUSKY tokens for referring others. The goal is to upgrade it into a fully functional **Telegram Mini App**, incorporating advanced features such as interactive UI, backend integration, gamification, and a structured economy for earning, staking, and withdrawing MUSKY and Solana. The **UI should be visually appealing**, with **great graphics and animations**, ensuring a smooth and engaging user experience. The web app should feel unique and interactive.

## Tech Stack
- **Programming Language:** Python
- **Frameworks & Libraries:**
  - `aiogram` (Telegram Bot API)
  - `FastAPI` or `Flask` (Backend API)
  - `SQLAlchemy` (Database ORM)
  - `PostgreSQL` or `MongoDB` (Database for user data and transactions)
  - `TON SDK` (for Toncoin transactions)
  - `Web3.py` (for blockchain integrations if needed)
  - `Celery` (for background task management)
  - `Redis` (for caching and real-time updates)
- **Hosting:**
  - VPS (e.g., DigitalOcean, AWS, or Heroku)
  - Firebase for notifications if needed

## Data Migration Plan
- Existing users are stored in `users.csv`.
- Migrate user data to a structured database without losing previous balances and referral history.
- Ensure existing MUSKY token allocations remain valid.

## User Onboarding & Referral System
- Users can join via an **invite link** or a **direct start**.
- Upon joining:
  - New users receive **2000 MUSKY**.
  - If referred, **both the referrer and referee** receive **2000 MUSKY**.
- Roadmap **loading screen** appears before the main interface.

## Main Interface & Features
### Home
- Users earn **1 MUSKY per tap** with smooth animations (similar to Notion/Hamster apps).
- **Top Left:** User Profile.
- **Upgrade Button:** Opens a new screen for upgrading status:
  - **Basic Musky → Hero Musky → Superhero Musky** (future: Mystic Musky, Legendary Musky)
  - Benefits: **Increased farm/hr**.
  - Upgrade costs: **Stars or TON**
    - Level 2: **500 Stars or 1 TON**
    - Level 3: **1000 Stars or 2 TON**
- **Farming Boosters:**
  - **x2 for 1 day** → **0.2 TON or 500 Stars**
  - **x2 for 3 days** → **0.5 TON or 1200 Stars**
  - **x3 for 7 days** → **1 TON or 2500 Stars**
  - **x4 for 30 days** → **4 TON or 10000 Stars**
- Each purchase grants a **shuffle ticket**.
- **Shuffle Ticket Pricing:**
  - **5 tickets** → **0.5 TON or 800 Stars**
  - **20 tickets** → **2 TON or 3000 Stars**
  - **50 tickets** → **3 TON or 5000 Stars**
  - **100 tickets** → **5 TON or 9000 Stars**
- **Live notifications & balance history.**

### Tasks
- **Users complete social tasks:**
  - **Telegram tasks** → **2000 MUSKY**
  - **YouTube tasks** → **3000 MUSKY**
  - **Twitter tasks** → **1500 MUSKY**
- **Task Marketplace:**
  - Users can **publish tasks** (verified by the admin).
  - **Metrics tracking** (clicks, spend, etc.).

### Friends
- **Invite & Earn:**
  - Earn **2000 MUSKY per referral**.
  - **10% commission on referral’s earnings.**

### Miner Section
- Users can **buy GPUs** with **MUSKY, TON, or Stars** to mine Solana.
- **Available Miners:**
  - **RTX 4070** → **40000 MUSKY or 5 TON or 12000 Stars** → **0.03 SOL/day**
  - **RTX 4090** → **75000 MUSKY or 10 TON or 25000 Stars** → **0.08 SOL/day**
  - **RTX 5070** → **25 TON or 60000 Stars** → **0.25 SOL/day (10 days)**
  - **RTX 5090 MAX** → **50 TON or 120000 Stars** → **0.5 SOL/day (10 days)**
- Users **must exhaust miner stock before upgrading.**

### Earn & Withdraw
- **Staking System:**
  - Earn **0.5% per day** on staked MUSKY/Solana.
- **Withdrawals:**
  - Users can request withdrawals after reaching **2 SOL**.
  - Recorded in a **database** for tracking.
- **Lucky Spin Feature:**
  - Rare rewards: **1 SOL, 0.5 SOL, MUSKY prizes, etc.**

## Backend Implementation Plan
- **Database Schema:**
  - Users (ID, Telegram ID, MUSKY balance, referral count, staking info)
  - Transactions (Earnings, spends, withdrawal requests)
  - Tasks (Published tasks, clicks, status tracking)
  - Miner purchases & earnings
- **API Endpoints:**
  - `/register_user`
  - `/update_balance`
  - `/get_tasks`
  - `/purchase_miner`
  - `/request_withdrawal`
- **Security Measures:**
  - Rate limiting
  - Webhook verification
  - JWT authentication for API access

## Next Steps
1. **Set up backend** (FastAPI/Flask + PostgreSQL/MongoDB).
2. **Migrate CSV users to database**.
3. **Integrate Telegram Mini App UI using aiogram**.
4. **Implement gamification elements & animations**.
5. **Deploy on VPS with monitoring tools.**

