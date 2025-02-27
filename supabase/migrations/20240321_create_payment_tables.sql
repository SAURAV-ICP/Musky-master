-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('miner', 'stamina', 'upgrade')),
    amount DECIMAL NOT NULL,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('TON', 'STARS')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create price configuration table
CREATE TABLE IF NOT EXISTS price_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL,
    ton_price DECIMAL NOT NULL,
    stars_price INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_type)
);

-- Create functions for incrementing values
CREATE OR REPLACE FUNCTION increment_mining_rate(user_id TEXT, increment DECIMAL)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    new_rate DECIMAL;
BEGIN
    UPDATE users
    SET mining_rate = COALESCE(mining_rate, 0) + increment
    WHERE users.user_id = increment_mining_rate.user_id
    RETURNING mining_rate INTO new_rate;
    
    RETURN new_rate;
END;
$$;

CREATE OR REPLACE FUNCTION increment_spin_energy(user_id TEXT, increment INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    new_energy INTEGER;
BEGIN
    UPDATE users
    SET spin_energy = COALESCE(spin_energy, 0) + increment
    WHERE users.user_id = increment_spin_energy.user_id
    RETURNING spin_energy INTO new_energy;
    
    RETURN new_energy;
END;
$$;

-- Insert default prices
INSERT INTO price_config (item_type, ton_price, stars_price) VALUES
('miner_basic', 1, 500),
('miner_advanced', 2, 1000),
('miner_premium', 5, 2500),
('stamina_small', 0.2, 100),
('stamina_medium', 0.5, 250),
('stamina_large', 1, 500),
('upgrade_premium', 10, 5000)
ON CONFLICT (item_type) DO UPDATE
SET ton_price = EXCLUDED.ton_price,
    stars_price = EXCLUDED.stars_price; 