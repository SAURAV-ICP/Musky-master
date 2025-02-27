import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Get user_id from the request headers or query params
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user's balance from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('balance, stars_balance')
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('Error fetching user balance:', error);
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      musky_balance: user.balance || 0,  // Main MUSKY token balance
      stars_balance: user.stars_balance || 0  // Telegram Stars balance
    });

  } catch (error) {
    console.error('Error in balance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 