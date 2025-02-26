-- Update admin user with correct settings
UPDATE users 
SET 
    is_admin = true,
    solana_balance = 100,
    balance = 1000000, -- 1M MUSKY
    mining_equipment = jsonb_build_object(
        'RTX4070', 999,
        'RTX4090', 999,
        'RTX5070', 999,
        'RTX5090MAX', 999
    ),
    spin_energy = 1200,
    level = 'admin'
WHERE user_id = '12345';

-- Ensure admin user exists, create if not
INSERT INTO users (
    user_id,
    username,
    is_admin,
    solana_balance,
    balance,
    mining_equipment,
    spin_energy,
    level
)
VALUES (
    '12345',
    'Admin',
    true,
    100,
    1000000,
    jsonb_build_object(
        'RTX4070', 999,
        'RTX4090', 999,
        'RTX5070', 999,
        'RTX5090MAX', 999
    ),
    1200,
    'admin'
)
ON CONFLICT (user_id) DO NOTHING; 