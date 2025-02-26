-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS solana_balance DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS mining_equipment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stars_balance BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update existing users with default values
UPDATE users 
SET 
    solana_balance = 0,
    mining_equipment = '{}',
    stars_balance = 0,
    is_admin = false
WHERE solana_balance IS NULL; 