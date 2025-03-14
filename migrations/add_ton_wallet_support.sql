-- Migration: Add TON wallet support to users table

DO $$
BEGIN
    -- Add ton_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'ton_address'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ton_address TEXT;
        RAISE NOTICE 'Added ton_address column to users table';
    ELSE
        RAISE NOTICE 'ton_address column already exists in users table';
    END IF;

    -- Add ton_balance column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'ton_balance'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ton_balance DECIMAL(20, 9) DEFAULT 0;
        RAISE NOTICE 'Added ton_balance column to users table';
    ELSE
        RAISE NOTICE 'ton_balance column already exists in users table';
    END IF;

    -- Add ton_address_updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'ton_address_updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN ton_address_updated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added ton_address_updated_at column to users table';
    ELSE
        RAISE NOTICE 'ton_address_updated_at column already exists in users table';
    END IF;

    -- Create index on ton_address for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND indexname = 'users_ton_address_idx'
    ) THEN
        CREATE INDEX users_ton_address_idx ON public.users USING btree (ton_address);
        RAISE NOTICE 'Created index on ton_address column';
    ELSE
        RAISE NOTICE 'Index on ton_address column already exists';
    END IF;

    -- Create index on ton_balance for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND indexname = 'users_ton_balance_idx'
    ) THEN
        CREATE INDEX users_ton_balance_idx ON public.users USING btree (ton_balance);
        RAISE NOTICE 'Created index on ton_balance column';
    ELSE
        RAISE NOTICE 'Index on ton_balance column already exists';
    END IF;

    -- Create function to update ton_address_updated_at timestamp
    CREATE OR REPLACE FUNCTION update_ton_address_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        IF OLD.ton_address IS DISTINCT FROM NEW.ton_address THEN
            NEW.ton_address_updated_at = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger to automatically update ton_address_updated_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ton_address_timestamp'
    ) THEN
        DROP TRIGGER IF EXISTS update_ton_address_timestamp ON public.users;
        CREATE TRIGGER update_ton_address_timestamp
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_ton_address_timestamp();
        RAISE NOTICE 'Created trigger for updating ton_address_updated_at';
    ELSE
        RAISE NOTICE 'Trigger for updating ton_address_updated_at already exists';
    END IF;
END
$$;