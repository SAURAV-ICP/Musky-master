-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username TEXT,
    balance BIGINT DEFAULT 0,
    energy INTEGER DEFAULT 100,
    last_tap_time TIMESTAMPTZ,
    last_energy_reset TIMESTAMPTZ,
    mining_rate DOUBLE PRECISION DEFAULT 1,
    level TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create mining_history table
CREATE TABLE IF NOT EXISTS mining_history (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    amount INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create energy_resets table
CREATE TABLE IF NOT EXISTS energy_resets (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    reset_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
); 