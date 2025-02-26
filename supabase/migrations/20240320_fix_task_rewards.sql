-- First, temporarily disable the constraint if it exists
ALTER TABLE task_submissions 
DROP CONSTRAINT IF EXISTS task_submissions_payment_type_check;

-- Update all existing tasks to use 'musky' payment type
UPDATE task_submissions 
SET payment_type = 'musky';

-- Now add the new constraint
ALTER TABLE task_submissions 
ADD CONSTRAINT task_submissions_payment_type_check 
CHECK (payment_type IN ('musky', 'ton'));

-- Update sample tasks with new MUSKY rewards
UPDATE task_submissions 
SET 
    payment_amount = CASE 
        WHEN type = 'telegram' THEN 2000  -- 2000 MUSKY for Telegram tasks
        WHEN type = 'youtube' THEN 3000   -- 3000 MUSKY for YouTube tasks
        WHEN type = 'twitter' THEN 1500   -- 1500 MUSKY for Twitter tasks
    END
WHERE user_id = '12345';

-- Delete any existing tasks and insert fresh ones
DELETE FROM task_submissions WHERE user_id = '12345';

-- Insert fresh sample tasks
INSERT INTO task_submissions (
    user_id, 
    type, 
    title, 
    description, 
    link, 
    clicks_wanted, 
    payment_amount, 
    payment_type, 
    button_text,
    image_url
) VALUES
(
    '12345',
    'telegram',
    'Join Musky Channel',
    'Join our official Telegram channel for updates and announcements',
    'https://t.me/musky_channel',
    100,
    2000,
    'musky',
    'Join Channel',
    'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/335_Telegram_logo-512.png'
),
(
    '12345',
    'youtube',
    'Watch & Subscribe',
    'Watch our latest video and subscribe to our YouTube channel',
    'https://youtube.com/musky',
    50,
    3000,
    'musky',
    'Watch Now',
    'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
),
(
    '12345',
    'twitter',
    'Follow & Retweet',
    'Follow our Twitter account and retweet our pinned post',
    'https://twitter.com/musky',
    75,
    1500,
    'musky',
    'Follow Now',
    'https://cdn-icons-png.flaticon.com/512/733/733579.png'
); 