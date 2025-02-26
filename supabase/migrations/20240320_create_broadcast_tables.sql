-- Create broadcasts table for in-bot broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(user_id),
  message TEXT NOT NULL,
  image_url TEXT,
  inline_markup JSONB,
  type TEXT NOT NULL CHECK (type IN ('inbot')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_broadcasts table for in-app broadcasts
CREATE TABLE IF NOT EXISTS app_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(user_id),
  image TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX broadcasts_admin_id_idx ON broadcasts(admin_id);
CREATE INDEX broadcasts_sent_at_idx ON broadcasts(sent_at);
CREATE INDEX app_broadcasts_admin_id_idx ON app_broadcasts(admin_id);
CREATE INDEX app_broadcasts_active_idx ON app_broadcasts(active);

-- Add RLS policies
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_broadcasts ENABLE ROW LEVEL SECURITY;

-- Admins can insert and read broadcasts
CREATE POLICY broadcasts_admin_insert ON broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ));

CREATE POLICY broadcasts_admin_select ON broadcasts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ));

-- Admins can insert, update and read app_broadcasts
CREATE POLICY app_broadcasts_admin_insert ON app_broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ));

CREATE POLICY app_broadcasts_admin_update ON app_broadcasts
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ));

CREATE POLICY app_broadcasts_admin_select ON app_broadcasts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.is_admin = true
  ));

-- All users can read active app_broadcasts
CREATE POLICY app_broadcasts_all_select ON app_broadcasts
  FOR SELECT TO authenticated
  USING (active = true); 