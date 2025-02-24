-- Create users table with new fields
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    referral_count BIGINT DEFAULT 0,
    balance BIGINT DEFAULT 0,
    solana_balance DOUBLE PRECISION DEFAULT 0,
    solana_address TEXT,
    verification_complete BOOLEAN DEFAULT FALSE,
    energy INTEGER DEFAULT 100,
    last_tap_time TIMESTAMPTZ,
    last_energy_reset TIMESTAMPTZ,
    mining_rate DOUBLE PRECISION DEFAULT 0,
    level TEXT DEFAULT 'basic',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    reward INTEGER NOT NULL,
    link TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id SERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES public.users(user_id),
    referred_id BIGINT REFERENCES public.users(user_id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);

-- Create spin_history table
CREATE TABLE IF NOT EXISTS public.spin_history (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id),
    prize_type TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create mining_history table
CREATE TABLE IF NOT EXISTS public.mining_history (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id),
    amount BIGINT NOT NULL,
    type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create energy_purchases table
CREATE TABLE IF NOT EXISTS public.energy_purchases (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(user_id),
    payment_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
); 