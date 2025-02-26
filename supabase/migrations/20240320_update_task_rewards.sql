-- First, modify the payment_type check constraint
ALTER TABLE task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_payment_type_check;

ALTER TABLE task_submissions 
ADD CONSTRAINT task_submissions_payment_type_check 
CHECK (payment_type IN ('musky', 'ton'));

-- Update existing tasks to use MUSKY instead of stars
UPDATE task_submissions 
SET payment_type = 'musky'
WHERE payment_type = 'stars';

-- Update sample tasks with new MUSKY rewards
UPDATE task_submissions 
SET 
    payment_amount = CASE 
        WHEN type = 'telegram' THEN 2000  -- 2000 MUSKY for Telegram tasks
        WHEN type = 'youtube' THEN 3000   -- 3000 MUSKY for YouTube tasks
        WHEN type = 'twitter' THEN 1500   -- 1500 MUSKY for Twitter tasks
    END,
    payment_type = 'musky'
WHERE user_id = '12345'; 