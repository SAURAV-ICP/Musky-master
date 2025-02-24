# Musky Mini App Backend

A FastAPI backend for the Musky Mini App, providing user management, mining balance updates, referral system, and Solana address verification.

## Features

- User Management
- Mining Balance Updates
- Referral System
- Solana Address Verification
- Leaderboard System

## Setup Instructions

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

4. Migrate existing users (if needed):
   ```bash
   python migrate_users.py
   ```

5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

The server will start at `http://localhost:8000`

## API Endpoints

### GET /
- Health check endpoint
- Returns: Welcome message

### POST /users
- Create a new user
- Body: User object
- Returns: Created user data

### GET /users/{user_id}
- Get user details
- Returns: User data

### POST /mining/update
- Update user's mining balance
- Body: MiningUpdate object
- Returns: Updated balance

### POST /referral
- Process referral
- Body: ReferralUpdate object
- Returns: Updated referral count

### POST /solana-address
- Update user's Solana address
- Body: SolanaAddressUpdate object
- Returns: Updated verification status

### GET /leaderboard
- Get top users by balance
- Returns: List of top 10 users

## Database Schema

### Users Table
- user_id (int, primary key)
- username (text, nullable)
- referral_count (int)
- balance (int)
- solana_address (text, nullable)
- verification_complete (boolean)

## Development

API documentation is available at `http://localhost:8000/docs` when running locally.

For local development, the server includes hot-reloading and Swagger UI for testing endpoints 