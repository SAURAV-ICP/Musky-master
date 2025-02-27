-- Function to process payments and update user benefits
CREATE OR REPLACE FUNCTION process_payment(
  p_user_id TEXT,
  p_payment_type TEXT,
  p_amount NUMERIC,
  p_item_type TEXT
) RETURNS void AS $$
DECLARE
  v_current_level INTEGER;
  v_mining_rate NUMERIC;
BEGIN
  -- Deduct payment amount if using Stars or MUSKY
  IF p_payment_type = 'STARS' THEN
    UPDATE users 
    SET stars_balance = stars_balance - p_amount
    WHERE user_id = p_user_id;
  ELSIF p_payment_type = 'MUSKY' THEN
    UPDATE users 
    SET balance = balance - p_amount
    WHERE user_id = p_user_id;
  END IF;

  -- Handle RTX miners
  IF p_item_type LIKE 'RTX%' THEN
    -- Insert new mining equipment
    INSERT INTO mining_equipment (user_id, equipment_type, mining_rate)
    SELECT p_user_id, p_item_type, mining_rate
    FROM equipment_config
    WHERE equipment_type = p_item_type;

    -- Update user's total mining rate
    UPDATE users 
    SET mining_rate = (
      SELECT COALESCE(SUM(mining_rate), 0)
      FROM mining_equipment
      WHERE user_id = p_user_id
    )
    WHERE user_id = p_user_id;

  -- Handle stamina purchases
  ELSIF p_item_type = 'stamina' THEN
    UPDATE users 
    SET spin_energy = spin_energy + p_amount
    WHERE user_id = p_user_id;

  -- Handle level upgrades
  ELSIF p_item_type LIKE 'level_%' THEN
    -- Get the level number from item_type (e.g., 'level_2' -> 2)
    v_current_level := SUBSTRING(p_item_type FROM 'level_([0-9]+)')::INTEGER;
    
    -- Get mining rate bonus for the level
    SELECT mining_rate_bonus INTO v_mining_rate
    FROM level_config
    WHERE level = v_current_level;

    -- Update user level and apply mining rate bonus
    UPDATE users 
    SET level = v_current_level,
        mining_rate = mining_rate * v_mining_rate
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql; 