-- Update users table with new fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stars_balance BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ton_balance DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS telegram_id TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spin_energy INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS last_spin_energy_reset TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT '1';

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link TEXT NOT NULL,
    clicks_wanted INTEGER NOT NULL,
    clicks_received INTEGER DEFAULT 0,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('stars', 'ton')),
    payment_amount DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create task_clicks table if not exists
CREATE TABLE IF NOT EXISTS task_clicks (
    id SERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES task_submissions(id),
    user_id BIGINT REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);

-- Create spin_history table (if not exists)
CREATE TABLE IF NOT EXISTS spin_history (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    prize_type TEXT NOT NULL CHECK (prize_type IN ('musky', 'solana', 'energy')),
    amount DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
    id SERIAL PRIMARY KEY,
    admin_id TEXT NOT NULL,
    message TEXT NOT NULL,
    inline_markup JSONB,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    users_messaged INTEGER DEFAULT 0
);

-- Create function to update task_submissions.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for task_submissions
CREATE TRIGGER update_task_submissions_updated_at
    BEFORE UPDATE ON task_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update all existing users to have 1200 spin energy
UPDATE users 
SET spin_energy = 1200,
    last_spin_energy_reset = CURRENT_TIMESTAMP
WHERE spin_energy IS NULL OR spin_energy = 0;

-- Update existing users with level if not set
UPDATE users 
SET level = '1'
WHERE level IS NULL;

-- Function to calculate current energy based on last tap time
CREATE OR REPLACE FUNCTION calculate_current_energy()
RETURNS TRIGGER AS $$
BEGIN
    -- If no last tap time, return max energy
    IF NEW.last_tap_time IS NULL THEN
        NEW.energy := 2000;
        RETURN NEW;
    END IF;

    -- Calculate time since last tap
    DECLARE
        time_since_last_tap INTERVAL;
        energy_per_hour NUMERIC;
        energy_gained NUMERIC;
        max_energy CONSTANT INTEGER := 2000;
    BEGIN
        time_since_last_tap := CURRENT_TIMESTAMP - NEW.last_tap_time;
        energy_per_hour := max_energy / 4.0; -- Full regeneration in 4 hours
        energy_gained := EXTRACT(EPOCH FROM time_since_last_tap) / 3600.0 * energy_per_hour;
        
        -- Update energy, capped at max_energy
        NEW.energy := LEAST(max_energy, NEW.energy + FLOOR(energy_gained));
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update energy on SELECT
CREATE OR REPLACE TRIGGER update_energy_on_read
    BEFORE SELECT ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_current_energy(); 