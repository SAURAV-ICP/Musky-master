import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, payment_type, amount, item_type } = await request.json();

    if (!user_id || !payment_type || !amount || !item_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's current balances
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stars_balance, balance')
      .eq('user_id', user_id)
      .single();

    if (userError) throw userError;

    // Check if user has enough balance for Stars or MUSKY payments
    if (payment_type === 'STARS' && user.stars_balance < amount) {
      return NextResponse.json({ error: 'Insufficient Stars balance' }, { status: 400 });
    }
    if (payment_type === 'MUSKY' && user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient MUSKY balance' }, { status: 400 });
    }

    // Start transaction
    const { error: txError } = await supabase.rpc('process_payment', {
      p_user_id: user_id,
      p_payment_type: payment_type,
      p_amount: amount,
      p_item_type: item_type
    });

    if (txError) throw txError;

    // Record the transaction
    const { error: recordError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: item_type.startsWith('RTX') ? 'miner' : 
              item_type === 'stamina' ? 'stamina' : 'upgrade',
        item_type,
        amount,
        currency: payment_type,
        status: 'completed'
      });

    if (recordError) throw recordError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 