-- Create staking_positions table
CREATE TABLE IF NOT EXISTS staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_claims table
CREATE TABLE IF NOT EXISTS daily_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_claim_date TIMESTAMP WITH TIME ZONE,
  total_claims INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create broadcast_messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  active BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_id ON daily_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_active ON broadcast_messages(active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_staking_positions_updated_at
BEFORE UPDATE ON staking_positions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_claims_updated_at
BEFORE UPDATE ON daily_claims
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcast_messages_updated_at
BEFORE UPDATE ON broadcast_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
-- Staking positions: Users can only read their own positions, admins can read all
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY staking_positions_select_policy ON staking_positions
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = TRUE)
);

-- Daily claims: Users can only read their own claims, admins can read all
ALTER TABLE daily_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_claims_select_policy ON daily_claims
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = TRUE)
);

-- Broadcast messages: All users can read, only admins can create/update/delete
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY broadcast_messages_select_policy ON broadcast_messages
FOR SELECT
USING (TRUE);

CREATE POLICY broadcast_messages_insert_policy ON broadcast_messages
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY broadcast_messages_update_policy ON broadcast_messages
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY broadcast_messages_delete_policy ON broadcast_messages
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND is_admin = TRUE)
); 