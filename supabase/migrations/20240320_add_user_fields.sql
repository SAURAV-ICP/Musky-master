-- Add missing columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mining_rate DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS solana_balance DOUBLE PRECISION DEFAULT 0;

-- Update existing users to have default values
UPDATE users 
SET 
  is_admin = FALSE,
  mining_rate = 0,
  solana_balance = 0
WHERE is_admin IS NULL 
   OR mining_rate IS NULL 
   OR solana_balance IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON users(is_admin);
CREATE INDEX IF NOT EXISTS users_mining_rate_idx ON users(mining_rate);
CREATE INDEX IF NOT EXISTS users_solana_balance_idx ON users(solana_balance); 