-- Add image_url column to task_submissions if it doesn't exist
ALTER TABLE task_submissions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS task_submissions_type_idx ON task_submissions(type);
CREATE INDEX IF NOT EXISTS task_submissions_status_idx ON task_submissions(status);
CREATE INDEX IF NOT EXISTS task_submissions_active_idx ON task_submissions(active);

-- Add RLS policies
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved and active tasks
CREATE POLICY "Anyone can read approved tasks" ON task_submissions
FOR SELECT
USING (status = 'approved' AND active = true);

-- Allow admins to do everything
CREATE POLICY "Admins can do everything" ON task_submissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.user_id = auth.uid()
        AND users.is_admin = true
    )
); 