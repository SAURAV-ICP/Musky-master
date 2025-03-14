-- Create daily_claims table
CREATE TABLE IF NOT EXISTS daily_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reward_amount INTEGER NOT NULL,
    streak_maintained BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user_id, day_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_id ON daily_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_claims_claimed_at ON daily_claims(claimed_at);

-- Create daily rewards configuration table
CREATE TABLE IF NOT EXISTS daily_rewards_config (
    day_number INTEGER PRIMARY KEY,
    reward_amount INTEGER NOT NULL,
    special_reward TEXT -- For special rewards like RTX4070 on day 15
);

-- Insert daily rewards configuration
INSERT INTO daily_rewards_config (day_number, reward_amount, special_reward) VALUES
(1, 1000, NULL),
(2, 2000, NULL),
(3, 3000, NULL),
(4, 4000, NULL),
(5, 5000, NULL),
(6, 6000, NULL),
(7, 7000, NULL),
(8, 8000, NULL),
(9, 9000, NULL),
(10, 10000, NULL),
(11, 15000, NULL),
(12, 20000, NULL),
(13, 25000, NULL),
(14, 40000, NULL),
(15, 5000, 'RTX4070') -- Day 15 gives both MUSKY and RTX4070
ON CONFLICT (day_number) DO UPDATE
SET reward_amount = EXCLUDED.reward_amount,
    special_reward = EXCLUDED.special_reward;

-- Function to check if user can claim daily reward
CREATE OR REPLACE FUNCTION can_claim_daily_reward(p_user_id TEXT)
RETURNS TABLE (
    can_claim BOOLEAN,
    next_day INTEGER,
    hours_until_next INTEGER,
    broke_streak BOOLEAN
) AS $$
DECLARE
    last_claim_time TIMESTAMPTZ;
    last_claim_day INTEGER;
BEGIN
    -- Get user's last claim
    SELECT claimed_at, day_number 
    INTO last_claim_time, last_claim_day
    FROM daily_claims 
    WHERE user_id = p_user_id 
    ORDER BY claimed_at DESC 
    LIMIT 1;

    -- If no previous claims, user can claim day 1
    IF last_claim_time IS NULL THEN
        RETURN QUERY SELECT 
            TRUE as can_claim,
            1 as next_day,
            0 as hours_until_next,
            FALSE as broke_streak;
        RETURN;
    END IF;

    -- Calculate hours since last claim
    hours_until_next := 
        CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - last_claim_time))/3600 < 24 
            THEN 24 - EXTRACT(EPOCH FROM (NOW() - last_claim_time))/3600
            ELSE 0
        END;

    -- Check if streak is broken (more than 48 hours since last claim)
    broke_streak := EXTRACT(EPOCH FROM (NOW() - last_claim_time))/3600 >= 48;

    -- Determine next day and if user can claim
    RETURN QUERY SELECT 
        hours_until_next = 0 as can_claim,
        CASE 
            WHEN broke_streak THEN 1 -- Reset to day 1 if streak broken
            WHEN last_claim_day >= 15 THEN 1 -- Reset after completing all 15 days
            ELSE last_claim_day + 1 -- Next day in sequence
        END as next_day,
        hours_until_next,
        broke_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to process daily claim
CREATE OR REPLACE FUNCTION process_daily_claim(p_user_id TEXT)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    reward_amount INTEGER,
    special_reward TEXT
) AS $$
DECLARE
    v_can_claim BOOLEAN;
    v_next_day INTEGER;
    v_hours_until_next INTEGER;
    v_broke_streak BOOLEAN;
    v_reward RECORD;
BEGIN
    -- Check if user can claim
    SELECT * FROM can_claim_daily_reward(p_user_id)
    INTO v_can_claim, v_next_day, v_hours_until_next, v_broke_streak;

    IF NOT v_can_claim THEN
        RETURN QUERY SELECT 
            FALSE,
            'Cannot claim yet. Try again in ' || v_hours_until_next || ' hours.',
            0,
            NULL::TEXT;
        RETURN;
    END IF;

    -- Get reward for this day
    SELECT * FROM daily_rewards_config
    WHERE day_number = v_next_day
    INTO v_reward;

    -- Record the claim
    INSERT INTO daily_claims (user_id, day_number, reward_amount, streak_maintained)
    VALUES (p_user_id, v_next_day, v_reward.reward_amount, NOT v_broke_streak);

    -- Add MUSKY reward to user's balance
    UPDATE users
    SET balance = balance + v_reward.reward_amount
    WHERE user_id = p_user_id;

    -- If there's a special reward (RTX4070 on day 15), add it
    IF v_reward.special_reward = 'RTX4070' THEN
        INSERT INTO mining_equipment (
            user_id,
            equipment_type,
            quantity,
            daily_rate,
            expires_at
        )
        VALUES (
            p_user_id,
            'RTX4070',
            1,
            (SELECT daily_solana FROM equipment_config WHERE type = 'RTX4070'),
            NOW() + INTERVAL '30 days'
        );
    END IF;

    RETURN QUERY SELECT 
        TRUE,
        'Successfully claimed day ' || v_next_day || ' reward!',
        v_reward.reward_amount,
        v_reward.special_reward;
END;
$$ LANGUAGE plpgsql; 