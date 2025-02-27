-- Create or update user_levels table
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'hero', 'superhero')),
    mining_multiplier DECIMAL NOT NULL DEFAULT 1,
    energy_boost INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or update mining_equipment table
CREATE TABLE IF NOT EXISTS mining_equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    equipment_type VARCHAR(20) NOT NULL CHECK (equipment_type IN ('RTX4070', 'RTX4090', 'RTX5070', 'RTX5090')),
    quantity INTEGER NOT NULL DEFAULT 0,
    daily_rate DECIMAL NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment_config table
CREATE TABLE IF NOT EXISTS equipment_config (
    type VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    daily_solana DECIMAL NOT NULL,
    ton_price DECIMAL NOT NULL,
    stars_price INTEGER NOT NULL,
    musky_price INTEGER,
    duration_days INTEGER NOT NULL,
    max_quantity INTEGER NOT NULL,
    required_previous_type VARCHAR(20),
    required_previous_quantity INTEGER
);

-- Insert mining equipment configurations
INSERT INTO equipment_config 
(type, name, daily_solana, ton_price, stars_price, musky_price, duration_days, max_quantity, required_previous_type, required_previous_quantity) 
VALUES
('RTX4070', 'RTX 4070', 0.03, 5, 2500, 40000, 30, 2, NULL, NULL),
('RTX4090', 'RTX 4090', 0.08, 9, 5000, 70000, 30, 2, 'RTX4070', 2),
('RTX5070', 'RTX 5070', 0.25, 25, 12500, NULL, 30, 2, 'RTX4090', 2),
('RTX5090', 'RTX 5090', 0.50, 50, 25000, NULL, 30, 2, 'RTX5070', 2)
ON CONFLICT (type) DO UPDATE
SET daily_solana = EXCLUDED.daily_solana,
    ton_price = EXCLUDED.ton_price,
    stars_price = EXCLUDED.stars_price,
    musky_price = EXCLUDED.musky_price;

-- Create level_config table
CREATE TABLE IF NOT EXISTS level_config (
    level VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ton_price DECIMAL NOT NULL,
    stars_price INTEGER NOT NULL,
    mining_multiplier DECIMAL NOT NULL,
    energy_boost INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    profile_image VARCHAR(255) NOT NULL
);

-- Insert level configurations
INSERT INTO level_config 
(level, name, ton_price, stars_price, mining_multiplier, energy_boost, duration_days, profile_image) 
VALUES
('hero', 'Hero Musky', 1, 500, 2, 50, 3, 'SUPERHERO.png'),
('superhero', 'Superhero Musky', 2, 1000, 4, 100, 3, 'SUPERHERO.png')
ON CONFLICT (level) DO UPDATE
SET ton_price = EXCLUDED.ton_price,
    stars_price = EXCLUDED.stars_price;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('miner', 'stamina', 'upgrade')),
    item_type VARCHAR(50) NOT NULL,
    amount DECIMAL NOT NULL,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('TON', 'STARS', 'MUSKY')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check equipment requirements
CREATE OR REPLACE FUNCTION check_equipment_requirements(
    p_user_id TEXT,
    p_equipment_type VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    required_type VARCHAR(20);
    required_qty INTEGER;
    actual_qty INTEGER;
BEGIN
    -- Get requirements
    SELECT required_previous_type, required_previous_quantity
    INTO required_type, required_qty
    FROM equipment_config
    WHERE type = p_equipment_type;
    
    -- If no requirements, return true
    IF required_type IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has required equipment
    SELECT COALESCE(SUM(quantity), 0)
    INTO actual_qty
    FROM mining_equipment
    WHERE user_id = p_user_id
    AND equipment_type = required_type
    AND expires_at > NOW();
    
    RETURN actual_qty >= required_qty;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user's total mining rate
CREATE OR REPLACE FUNCTION calculate_mining_rate(p_user_id TEXT)
RETURNS DECIMAL AS $$
DECLARE
    base_rate DECIMAL := 0;
    multiplier DECIMAL := 1;
BEGIN
    -- Sum up all active mining equipment rates
    SELECT COALESCE(SUM(me.quantity * ec.daily_solana), 0)
    INTO base_rate
    FROM mining_equipment me
    JOIN equipment_config ec ON me.equipment_type = ec.type
    WHERE me.user_id = p_user_id
    AND me.expires_at > NOW();
    
    -- Get user's active multiplier
    SELECT COALESCE(mining_multiplier, 1)
    INTO multiplier
    FROM user_levels
    WHERE user_id = p_user_id
    AND expires_at > NOW()
    ORDER BY mining_multiplier DESC
    LIMIT 1;
    
    RETURN base_rate * multiplier;
END;
$$ LANGUAGE plpgsql; 