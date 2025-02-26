import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface BroadcastRequest {
  admin_id: string;
  type: 'inbot' | 'inapp';
  message?: string;
  image_url?: string;
  inline_markup?: { buttons: { text: string; url: string }[] };
  image?: string;
  button_text?: string;
  button_url?: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramBroadcast(message: string, imageUrl?: string, inlineMarkup?: any) {
  try {
    // Get all users with telegram_id
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('telegram_id')
      .not('telegram_id', 'is', null);

    if (usersError) throw usersError;

    for (const user of users) {
      if (!user.telegram_id) continue;

      // Prepare inline keyboard if needed
      const reply_markup = inlineMarkup ? {
        inline_keyboard: [inlineMarkup.buttons.map((btn: any) => ({
          text: btn.text,
          url: btn.url
        }))]
      } : undefined;

      // Send image if provided
      if (imageUrl) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            photo: imageUrl,
            caption: message,
            parse_mode: 'HTML',
            reply_markup
          })
        });
      } else {
        // Send text message
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: message,
            parse_mode: 'HTML',
            reply_markup
          })
        });
      }
    }
    return true;
  } catch (error) {
    console.error('Error sending Telegram broadcast:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as BroadcastRequest;
    
    // Verify admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('user_id', data.admin_id)
      .single();

    if (adminError || !admin?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (data.type === 'inbot') {
      // Handle in-bot broadcast
      if (!data.message) {
        return NextResponse.json({ error: 'Message is required for in-bot broadcast' }, { status: 400 });
      }

      const success = await sendTelegramBroadcast(data.message, data.image_url, data.inline_markup);
      
      if (!success) {
        throw new Error('Failed to send Telegram broadcast');
      }

      // Store broadcast in history
      await supabase.from('broadcasts').insert({
        admin_id: data.admin_id,
        message: data.message,
        image_url: data.image_url,
        inline_markup: data.inline_markup,
        type: 'inbot',
        sent_at: new Date().toISOString()
      });

    } else {
      // Handle in-app broadcast
      if (!data.image || !data.button_text || !data.button_url) {
        return NextResponse.json({ 
          error: 'Image, button text, and button URL are required for in-app broadcast' 
        }, { status: 400 });
      }

      // Store in-app broadcast
      await supabase.from('app_broadcasts').insert({
        admin_id: data.admin_id,
        image: data.image,
        button_text: data.button_text,
        button_url: data.button_url,
        active: true,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: `${data.type === 'inbot' ? 'In-bot' : 'In-app'} broadcast sent successfully`
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}