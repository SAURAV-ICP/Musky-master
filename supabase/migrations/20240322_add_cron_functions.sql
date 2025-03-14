-- Function to reset broken streaks
CREATE OR REPLACE FUNCTION reset_broken_streaks()
RETURNS void AS $$
BEGIN
  -- Find users who haven't claimed in the last 24 hours and reset their streak
  UPDATE daily_claims dc
  SET streak_maintained = false
  FROM (
    SELECT DISTINCT user_id
    FROM daily_claims
    WHERE claimed_at < NOW() - INTERVAL '24 hours'
    AND streak_maintained = true
  ) broken_streaks
  WHERE dc.user_id = broken_streaks.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mining rate for a user
CREATE OR REPLACE FUNCTION calculate_user_mining_rate(user_id_param uuid)
RETURNS decimal AS $$
DECLARE
  total_rate decimal := 0;
  level_multiplier decimal;
  boost_multiplier decimal := 1;
BEGIN
  -- Get user's level multiplier
  SELECT mining_multiplier INTO level_multiplier
  FROM user_levels
  WHERE user_id = user_id_param;

  -- Get active boost multiplier if any
  SELECT COALESCE(MAX(multiplier), 1) INTO boost_multiplier
  FROM user_boosts
  WHERE user_id = user_id_param
  AND is_active = true
  AND expires_at > NOW();

  -- Calculate total mining rate from active equipment
  SELECT COALESCE(SUM(me.quantity * ec.daily_rate), 0) INTO total_rate
  FROM mining_equipment me
  JOIN equipment_config ec ON me.equipment_type = ec.type
  WHERE me.user_id = user_id_param
  AND me.is_active = true
  AND me.expires_at > NOW();

  -- Apply multipliers
  RETURN total_rate * COALESCE(level_multiplier, 1) * boost_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Function to update mining balances
CREATE OR REPLACE FUNCTION update_mining_balances()
RETURNS json AS $$
DECLARE
  users_updated integer := 0;
  total_solana_mined decimal := 0;
  user_record record;
  mining_rate decimal;
  hours_since_last_update interval;
BEGIN
  FOR user_record IN
    SELECT DISTINCT me.user_id, u.last_mining_update
    FROM mining_equipment me
    JOIN users u ON me.user_id = u.id
    WHERE me.is_active = true
    AND me.expires_at > NOW()
  LOOP
    -- Calculate hours since last update
    hours_since_last_update := NOW() - COALESCE(user_record.last_mining_update, NOW() - INTERVAL '1 hour');
    
    -- Calculate mining rate
    mining_rate := calculate_user_mining_rate(user_record.user_id);
    
    -- Update user's Solana balance
    UPDATE users
    SET 
      solana_balance = solana_balance + (mining_rate * EXTRACT(EPOCH FROM hours_since_last_update) / 3600),
      last_mining_update = NOW()
    WHERE id = user_record.user_id;

    users_updated := users_updated + 1;
    total_solana_mined := total_solana_mined + (mining_rate * EXTRACT(EPOCH FROM hours_since_last_update) / 3600);
  END LOOP;

  -- Log the update
  INSERT INTO mining_logs (users_updated, total_solana_mined)
  VALUES (users_updated, total_solana_mined);

  RETURN json_build_object(
    'users_updated', users_updated,
    'total_solana_mined', total_solana_mined
  );
END;
$$ LANGUAGE plpgsql; 