-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    referral_count BIGINT DEFAULT 0,
    balance BIGINT DEFAULT 0,
    solana_address TEXT,
    verification_complete BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
); 