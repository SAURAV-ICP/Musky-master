import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ADMIN_ID = process.env.ADMIN_ID;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function notifyAdmin(withdrawalData: any) {
  if (!ADMIN_ID || !BOT_TOKEN) {
    console.error('Missing admin ID or bot token');
    return;
  }

  const message = `
🔄 New Withdrawal Request

User: ${withdrawalData.username}
Amount: ${withdrawalData.amount} SOL
Wallet: ${withdrawalData.solana_address}

To approve/decline, use the admin panel.
`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, amount, solana_address, username } = await request.json();

    if (!user_id || !amount || !solana_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user and balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('solana_balance')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.solana_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id,
        amount,
        solana_address,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (withdrawalError) {
      throw withdrawalError;
    }

    // Notify admin
    await notifyAdmin({
      username,
      amount,
      solana_address,
      withdrawal_id: withdrawal.id
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted for approval'
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
} 