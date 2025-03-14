-- Function to update mining balances
CREATE OR REPLACE FUNCTION update_mining_balances()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all users with active mining equipment
    FOR r IN (
        SELECT DISTINCT me.user_id
        FROM mining_equipment me
        WHERE me.expires_at > NOW()
    ) LOOP
        -- Calculate and update Solana balance
        UPDATE users u
        SET 
            solana_balance = solana_balance + (
                SELECT COALESCE(SUM(me.quantity * ec.daily_solana), 0) * 
                       COALESCE((
                           SELECT mining_multiplier 
                           FROM user_levels ul 
                           WHERE ul.user_id = u.user_id 
                           AND ul.expires_at > NOW() 
                           ORDER BY mining_multiplier DESC 
                           LIMIT 1
                       ), 1)
                FROM mining_equipment me
                JOIN equipment_config ec ON me.equipment_type = ec.type
                WHERE me.user_id = u.user_id
                AND me.expires_at > NOW()
            ) / 24 -- Divide by 24 since we run hourly
        WHERE u.user_id = r.user_id;

        -- Update mining rate
        UPDATE users u
        SET mining_rate = (
            SELECT COALESCE(SUM(me.quantity * ec.daily_solana), 0) * 
                   COALESCE((
                       SELECT mining_multiplier 
                       FROM user_levels ul 
                       WHERE ul.user_id = u.user_id 
                       AND ul.expires_at > NOW() 
                       ORDER BY mining_multiplier DESC 
                       LIMIT 1
                   ), 1)
            FROM mining_equipment me
            JOIN equipment_config ec ON me.equipment_type = ec.type
            WHERE me.user_id = u.user_id
            AND me.expires_at > NOW()
        )
        WHERE u.user_id = r.user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create mining_logs table for tracking updates
CREATE TABLE IF NOT EXISTS mining_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    users_updated INTEGER,
    total_solana_mined DECIMAL,
    details JSONB
);

-- Function to log mining updates
CREATE OR REPLACE FUNCTION log_mining_update()
RETURNS void AS $$
DECLARE
    users_count INTEGER;
    total_mined DECIMAL;
BEGIN
    -- Get statistics
    SELECT 
        COUNT(DISTINCT user_id),
        COALESCE(SUM(mining_rate), 0)
    INTO 
        users_count,
        total_mined
    FROM users
    WHERE mining_rate > 0;

    -- Log the update
    INSERT INTO mining_logs (users_updated, total_solana_mined, details)
    VALUES (
        users_count,
        total_mined,
        jsonb_build_object(
            'timestamp', NOW(),
            'active_miners', users_count,
            'hourly_rate', total_mined / 24
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create cron job to run mining updates
SELECT cron.schedule(
    'update-mining-hourly',
    '0 * * * *', -- Run every hour
    $$
    BEGIN
        PERFORM update_mining_balances();
        PERFORM log_mining_update();
    END;
    $$
); 