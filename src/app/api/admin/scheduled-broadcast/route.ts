import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Extract bot username from token (first part before colon)
const BOT_USERNAME = TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.split(':')[0] : 'your_bot_username';

// This function will be called by a cron job every 24 hours
export async function GET(request: Request) {
  try {
    // Verify the request has a valid secret key
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    
    // Simple security check - in production, use a more secure method
    if (secretKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, telegram_id, balance')
      .not('telegram_id', 'is', null);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    // Create promotional messages
    const messages = [
      "🚀 Don't forget to collect your daily MUSKY tokens! Keep earning and staking for maximum rewards!",
      "💰 Your MUSKY tokens are waiting for you! Claim your daily rewards and boost your earnings!",
      "✨ Stake your MUSKY tokens today and earn up to 40% APY! The longer you stake, the more you earn!",
      "🔥 Hot tip: Collect your MUSKY tokens daily to maintain your streak and earn bonus rewards!",
      "💎 Diamond hands get the best rewards! Stake your MUSKY tokens for 180 days for maximum returns!"
    ];
    
    // Select a random message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create inline keyboard with buttons
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "🎁 Claim Daily Rewards", url: `https://t.me/${BOT_USERNAME}?start=daily` },
          { text: "💰 Stake Tokens", url: `https://t.me/${BOT_USERNAME}?start=stake` }
        ]
      ]
    };
    
    // Send message to all users
    let successCount = 0;
    for (const user of users) {
      if (!user.telegram_id) continue;
      
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: randomMessage,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard
          })
        });
        successCount++;
      } catch (error) {
        console.error(`Error sending message to user ${user.user_id}:`, error);
      }
    }
    
    // Log the broadcast
    await supabase.from('broadcasts').insert({
      admin_id: 'system',
      message: randomMessage,
      type: 'scheduled',
      sent_at: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Scheduled broadcast sent to ${successCount} users`
    });
    
  } catch (error) {
    console.error('Scheduled broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send scheduled broadcast' }, { status: 500 });
  }
} 