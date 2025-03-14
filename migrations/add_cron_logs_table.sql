-- Migration: Add cron_logs table for tracking cron job executions

DO $$
BEGIN
    -- Check if the cron_logs table already exists
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'cron_logs'
    ) THEN
        -- Create the cron_logs table
        CREATE TABLE public.cron_logs (
            id SERIAL PRIMARY KEY,
            job_name TEXT NOT NULL,
            success_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            details TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add comments to the table and columns
        COMMENT ON TABLE public.cron_logs IS 'Logs of cron job executions';
        COMMENT ON COLUMN public.cron_logs.job_name IS 'Name of the cron job';
        COMMENT ON COLUMN public.cron_logs.success_count IS 'Number of successful operations';
        COMMENT ON COLUMN public.cron_logs.error_count IS 'Number of failed operations';
        COMMENT ON COLUMN public.cron_logs.details IS 'Additional details about the job execution';

        -- Create indexes for faster lookups
        CREATE INDEX idx_cron_logs_job_name ON public.cron_logs (job_name);
        
        -- Create index on created_at for time-based queries
        CREATE INDEX idx_cron_logs_created_at ON public.cron_logs (created_at);
        
        -- Create function to automatically update updated_at column
        CREATE OR REPLACE FUNCTION update_cron_logs_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create trigger to call the function before update
        CREATE TRIGGER update_cron_logs_updated_at
        BEFORE UPDATE ON public.cron_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_cron_logs_updated_at();
        
        RAISE NOTICE 'Created cron_logs table';
    ELSE
        RAISE NOTICE 'cron_logs table already exists';
    END IF;
END
$$; 