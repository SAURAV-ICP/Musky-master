import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user with admin privileges and equipment
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        is_admin: true,
        solana_balance: 100,
        mining_equipment: {
          RTX4070: 999,
          RTX4090: 999,
          RTX5070: 999,
          RTX5090MAX: 999
        },
        stars_balance: 1000000, // Give plenty of stars for testing
        spin_energy: 1200,
        level: 'admin'
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 });
  }
} 