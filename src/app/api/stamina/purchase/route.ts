import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PURCHASE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function POST(request: Request) {
  try {
    const { user_id, amount, cost } = await request.json();

    if (!user_id || !amount || !cost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate amount range
    if (amount < 1000 || amount > 10000) {
      return NextResponse.json({ error: 'Invalid stamina amount' }, { status: 400 });
    }

    // Get user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check purchase cooldown
    if (user.last_stamina_purchase) {
      const lastPurchase = new Date(user.last_stamina_purchase).getTime();
      const now = Date.now();
      if (now - lastPurchase < PURCHASE_COOLDOWN) {
        const hoursLeft = Math.ceil((PURCHASE_COOLDOWN - (now - lastPurchase)) / (60 * 60 * 1000));
        return NextResponse.json({
          error: `Please wait ${hoursLeft} hours before purchasing again`,
          next_purchase: new Date(lastPurchase + PURCHASE_COOLDOWN).toISOString()
        }, { status: 400 });
      }
    }

    // Check if user has enough stars
    if (!user.stars || user.stars < cost) {
      return NextResponse.json({ error: 'Insufficient stars' }, { status: 400 });
    }

    // Update user's stamina and stars
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        spin_energy: (user.spin_energy || 0) + amount,
        stars: user.stars - cost,
        last_stamina_purchase: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      spin_energy: updatedUser.spin_energy,
      stars: updatedUser.stars,
      next_purchase: new Date(Date.now() + PURCHASE_COOLDOWN).toISOString()
    });

  } catch (error) {
    console.error('Stamina purchase error:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
} 