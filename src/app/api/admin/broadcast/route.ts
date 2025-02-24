import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface BroadcastRequest {
  admin_id: string;
  message: string;
  inline_markup?: { buttons: { text: string; url: string }[] };
  type?: 'regular' | 'popup'; // Add type for popup broadcasts
}

export async function POST(request: Request) {
  try {
    const { admin_id, message, inline_markup, type = 'regular' } = await request.json() as BroadcastRequest;

    if (!admin_id || !message) {
      return NextResponse.json({ error: 'Admin ID and message are required' }, { status: 400 });
    }

    // Verify admin (example, adjust based on your auth)
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('user_id', admin_id)
      .single();

    if (adminError || !admin || !admin.is_admin) {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 403 });
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, telegram_id'); // Assuming telegram_id for Telegram notification

    if (usersError) {
      throw usersError;
    }

    // Prepare broadcast data
    const broadcastData = {
      message,
      inline_markup,
      type, // Include type for frontend handling (regular or popup)
      timestamp: new Date().toISOString(),
    };

    // Store broadcast in Supabase (optional, for history)
    const { error: broadcastError } = await supabase
      .from('broadcasts') // Create this table if needed
      .insert({
        admin_id,
        message,
        inline_markup: inline_markup ? JSON.stringify(inline_markup) : null,
        type,
      });

    if (broadcastError) {
      console.error('Failed to store broadcast:', broadcastError);
    }

    // For regular broadcasts, you might send to Telegram (optional, implement as needed)
    if (type === 'regular' && users) {
      users.forEach(async (user) => {
        if (user.telegram_id) {
          // Example: Send to Telegram (implement Telegram bot logic here)
          // await telegramBot.sendMessage(user.telegram_id, message, { reply_markup: inline_markup });
        }
      });
    }

    // For popup broadcasts, store in a table for mini app retrieval
    if (type === 'popup') {
      const { error: popupError } = await supabase
        .from('popup_broadcasts') // Create this table if needed
        .insert(broadcastData);

      if (popupError) {
        console.error('Failed to store popup broadcast:', popupError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Broadcast sent successfully',
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}