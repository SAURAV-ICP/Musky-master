-- Migration to add cron_logs table for tracking cron job executions

-- Check if the cron_logs table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cron_logs') THEN
        -- Create the cron_logs table
        CREATE TABLE public.cron_logs (
            id SERIAL PRIMARY KEY,
            job_name TEXT NOT NULL,
            success_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            details TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add comment to the table
        COMMENT ON TABLE public.cron_logs IS 'Logs for tracking cron job executions';
        
        -- Add comments to columns
        COMMENT ON COLUMN public.cron_logs.job_name IS 'Name of the cron job';
        COMMENT ON COLUMN public.cron_logs.success_count IS 'Number of successful operations';
        COMMENT ON COLUMN public.cron_logs.error_count IS 'Number of failed operations';
        COMMENT ON COLUMN public.cron_logs.details IS 'Additional details about the job execution';
        COMMENT ON COLUMN public.cron_logs.created_at IS 'Timestamp when the log was created';
        COMMENT ON COLUMN public.cron_logs.updated_at IS 'Timestamp when the log was last updated';
        
        -- Create index on job_name for faster lookups
        CREATE INDEX idx_cron_logs_job_name ON public.cron_logs (job_name);
        
        -- Create index on created_at for faster date-based queries
        CREATE INDEX idx_cron_logs_created_at ON public.cron_logs (created_at);
        
        -- Create function to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_cron_logs_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create trigger to automatically update the updated_at timestamp
        CREATE TRIGGER update_cron_logs_updated_at
        BEFORE UPDATE ON public.cron_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_cron_logs_updated_at();
        
        RAISE NOTICE 'Created cron_logs table';
    ELSE
        RAISE NOTICE 'cron_logs table already exists';
    END IF;
END $$; 