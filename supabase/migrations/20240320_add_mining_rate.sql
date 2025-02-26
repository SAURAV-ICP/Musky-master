-- Add mining_rate column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mining_rate DOUBLE PRECISION DEFAULT 0;

-- Update existing users to have a default mining rate
UPDATE users 
SET mining_rate = 0
WHERE mining_rate IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS users_mining_rate_idx ON users(mining_rate); 