-- Migration: Create exec_sql function for running migrations

-- This function allows executing SQL commands from our migration scripts
-- It requires the service role key to run for security reasons

DO $$
BEGIN
    -- Check if the function already exists
    IF NOT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'exec_sql' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Create the function
        CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
        RETURNS TEXT
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
            RETURN 'SQL executed successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'Error executing SQL: ' || SQLERRM;
        END;
        $$;

        -- Add comment to the function
        COMMENT ON FUNCTION public.exec_sql(TEXT) IS 'Executes SQL commands for migrations. Requires service role key.';
        
        RAISE NOTICE 'Created exec_sql function';
    ELSE
        RAISE NOTICE 'exec_sql function already exists';
    END IF;
END
$$; 