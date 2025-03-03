-- Add TON wallet support to users table
-- This migration ensures the ton_address field exists in the users table

-- Check if ton_address column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'ton_address'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ton_address text NULL;
    END IF;
END $$;

-- Create index on ton_address for faster lookups
CREATE INDEX IF NOT EXISTS users_ton_address_idx ON public.users USING btree (ton_address);

-- Add ton_balance column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'ton_balance'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ton_balance double precision NULL DEFAULT 0;
    END IF;
END $$;

-- Create index on ton_balance for faster lookups
CREATE INDEX IF NOT EXISTS users_ton_balance_idx ON public.users USING btree (ton_balance);

-- Add comment to explain the purpose of these fields
COMMENT ON COLUMN public.users.ton_address IS 'User''s TON wallet address for payments and withdrawals';
COMMENT ON COLUMN public.users.ton_balance IS 'User''s TON token balance';

-- Create a function to update the updated_at timestamp when ton_address is updated
CREATE OR REPLACE FUNCTION update_ton_address_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the timestamp when ton_address is updated
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_ton_address_timestamp_trigger'
    ) THEN
        CREATE TRIGGER update_ton_address_timestamp_trigger
        BEFORE UPDATE OF ton_address ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_ton_address_timestamp();
    END IF;
END $$;