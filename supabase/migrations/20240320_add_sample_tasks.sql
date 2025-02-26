-- First, create task_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('telegram', 'youtube', 'twitter')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link TEXT NOT NULL,
    clicks_wanted INTEGER NOT NULL,
    clicks_received INTEGER DEFAULT 0,
    payment_amount INTEGER NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('stars', 'ton')),
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    button_text TEXT,
    active BOOLEAN DEFAULT true
);

-- Add sample tasks
INSERT INTO task_submissions (user_id, type, title, description, link, clicks_wanted, payment_amount, payment_type, button_text) VALUES
('12345', 'telegram', 'Join Musky Channel', 'Join our official Telegram channel for updates', 'https://t.me/musky_channel', 100, 2000, 'stars', 'Join Channel'),
('12345', 'youtube', 'Watch & Subscribe', 'Watch our latest video and subscribe', 'https://youtube.com/musky', 50, 3000, 'stars', 'Watch Now'),
('12345', 'twitter', 'Follow & Retweet', 'Follow our Twitter and retweet pinned post', 'https://twitter.com/musky', 75, 1500, 'stars', 'Follow Now');

-- Update task images
UPDATE task_submissions 
SET image_url = CASE 
    WHEN type = 'telegram' THEN 'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/335_Telegram_logo-512.png'
    WHEN type = 'youtube' THEN 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
    WHEN type = 'twitter' THEN 'https://cdn-icons-png.flaticon.com/512/733/733579.png'
END;

-- Update admin user with special privileges and mining equipment
UPDATE users 
SET 
    is_admin = true,
    solana_balance = 100,
    mining_equipment = jsonb_build_object(
        'RTX4070', 999,
        'RTX4090', 999,
        'RTX5070', 999,
        'RTX5090MAX', 999
    ),
    stars_balance = 1000000,
    spin_energy = 1200,
    level = 'admin'
WHERE user_id = '12345';

-- Add GPU images to a configuration table
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value JSONB
);

INSERT INTO config (key, value) VALUES
('gpu_images', '{
    "RTX4070": "https://dlcdnwebimgs.asus.com/files/media/9F5D2F8F-3C24-4857-9779-2C9D5C0E99B8/v1/img/kv.png",
    "RTX4090": "https://dlcdnwebimgs.asus.com/files/media/89F82A09-B761-4172-BBAB-3F5BB9A81D64/v1/img/kv.png",
    "RTX5070": "https://cdn.videocardz.com/1/2023/10/NVIDIA-RTX-5000-ADA-WORKSTATION.jpg",
    "RTX5090MAX": "https://cdn.wccftech.com/wp-content/uploads/2024/01/NVIDIA-GeForce-RTX-5090-Graphics-Card-Render.jpg"
}'::jsonb)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value; 